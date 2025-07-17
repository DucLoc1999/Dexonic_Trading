import asyncio, threading
import json, time, ulid, yaml

from typing import Tuple
from aptos_sdk.account import Account
from aptos_sdk.async_client import RestClient
from aptos_sdk.bcs import Serializer
from aptos_sdk.transactions import EntryFunction, TransactionPayload, TransactionArgument
from aptos_sdk.type_tag import StructTag, TypeTag

from lib.trading import BaseBroker, Order, OrderPlan, TradingBot

def start_loop(loop: asyncio.AbstractEventLoop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

# Create background event loop for async operations
bg_loop = asyncio.new_event_loop()
bg_thread = threading.Thread(target=start_loop, args=(bg_loop,), daemon=True)
bg_thread.start()

def run_async(coro: asyncio.coroutines):
    try:
        future = asyncio.run_coroutine_threadsafe(coro, bg_loop)
        return future.result(timeout=30)  # Add timeout to prevent hanging
    except Exception as e:
        print(f"Error running async function: {e}")
        raise e

async def get_token_info(token_types, rest_client) -> dict:
    tasks = []
    for token_type in token_types:
        creator = token_type.split("::", 1)[0]
        resource_type = f"0x1::coin::CoinInfo<{token_type}>"
        tasks.append(rest_client.account_resource(creator, resource_type))

    responses = await asyncio.gather(*tasks, return_exceptions=True)
    return {token_types[i]: json.dumps(responses[i]) for i in range(len(token_types))}


class PancakeBroker(BaseBroker):
    def __init__(self, rpcs, ecosystem_token='APT', contract_info:dict=None):
        self.rpc_urls = rpcs
        self.gateway = RestClient(rpcs[0])
        self.ecosystem_token = ecosystem_token or 'APT'
        self.contract_info = contract_info
        self.tokens = contract_info['tokens']
        self.type2symbol = {info[0] : t for t, info in self.tokens.items()}
        self.router_address = contract_info['router'][0]

    def get_decimal(self, symbol: str):
        decimal = json.loads(self.tokens[symbol][1])['data']['decimals']
        return int(decimal)

    def to_wei(self, symbol: str, amount: float):
        decimal = self.get_decimal(symbol)
        return int(amount * 10**decimal)

    def from_wei(self, symbol: str, amount: int):
        decimal = self.get_decimal(symbol)
        return amount / 10**decimal

    def load_account(self, wallet_key: str):
        """Load account from wallet key"""
        if isinstance(wallet_key, str):
            account = Account.load_key(wallet_key)
        elif isinstance(wallet_key, dict):
            account = Account.load_key(wallet_key.get('private', ''))
        else:
            raise ValueError("Invalid wallet key format")
        return account

    def check_balance(self, bot: 'TradingBot', re_check=True) -> Tuple[float, float]:
        """
        Check the balance of the bot, based on the bot. tokens and currency in the bot.
        update bot:
         - _token_balance
         - balance
         - pending_amount
        """
        resources = run_async(self.gateway.account_resources(bot.account.address()))

        pending_amount = 0.0 # total amount equal to value of non-currency tokens in open orders
        for res in resources:
            if res["type"].startswith("0x1::coin::CoinStore<"):
                # tách coin_type từ resource type
                coin_type = res["type"].split("<", 1)[1].rstrip(">")
                symbol = self.type2symbol.get(coin_type, None)
                if symbol is None or symbol not in bot.tokens + [bot.currency]:
                    continue
                elif symbol not in bot._token_balance.keys():
                    bot._token_balance[symbol] = {'qty': 0, 'value': 0.0}

                bot._token_balance[symbol]['qty'] = int(res["data"]["coin"]["value"])
                
                if symbol != bot.currency and bot._token_balance[symbol]['qty'] > 0:
                    path, amounts_outs = self.estimate([symbol, bot.currency], bot._token_balance[symbol]['qty'], function='getAmountsOut')
                    v = amounts_outs[-1]
                    value = self.from_wei(symbol, v) if v > 0 else 0.0
                    bot._token_balance[symbol]['value'] = value
                    pending_amount += value

        value = self.from_wei(bot.currency, bot._token_balance[bot.currency]['qty'])
        bot._token_balance[bot.currency]['value'] = value

        balance = bot._token_balance[bot.currency]['value']
        
        return balance, pending_amount

    async def token_registered(self, account: Account, token: str):
        addr = account.address()

        resources = await self.gateway.account_resources(addr)
        token_type = self.tokens.get(token, [None, None])[0]
        typ_pattern = f"0x1::coin::CoinStore<{token_type}>"
        is_registered = any(res["type"] == typ_pattern for res in resources)

        if is_registered:
            return None
        else:
            print("not registered yet, starting registration...", token_type)
        payload = EntryFunction.natural(
            "0x1::managed_coin",
            "register",
            [TypeTag(StructTag.from_str(token_type))],
            [],
        )
        tx_hash = await self.send_tx(account, payload)
        return await self.gateway.wait_for_transaction(tx_hash)

    async def send_tx(self, account: Account, payload):
        signed_tx = await self.gateway.create_bcs_signed_transaction(
            sender=account,
            payload=TransactionPayload(payload)
        )

        submit_res = await self.gateway.submit_bcs_transaction(signed_tx)
        return submit_res
    
    async def get_reserves(self, token_in, token_out):
        reserve_in = reserve_out = 0
        try: 
            res = await self.gateway.account_resource(
                self.router_address,
                f"{self.router_address}::swap::TokenPairReserve<{self.tokens[token_in][0]}, {self.tokens[token_out][0]}>"
            )

            reserve_in = int(res['data']['reserve_x'])
            reserve_out = int(res['data']['reserve_y'])
        except Exception as e:
            res = await self.gateway.account_resource(
                self.router_address,
                f"{self.router_address}::swap::TokenPairReserve<{self.tokens[token_out][0]}, {self.tokens[token_in][0]}>"
            )
            reserve_out = int(res['data']['reserve_x'])
            reserve_in = int(res['data']['reserve_y'])
        return reserve_in, reserve_out

    def get_amount_out(self, amount_in, token_in, token_out, fee=0.9975):
        reserve_in, reserve_out = run_async(self.get_reserves(token_in, token_out))
        amount_in_with_fee = amount_in * fee
        numerator = amount_in_with_fee * reserve_out
        denominator = reserve_in + amount_in_with_fee
        return numerator // denominator

    def get_amount_in(self, amount_out, token_in, token_out, fee=0.9975):
        reserve_in, reserve_out = run_async(self.get_reserves(token_in, token_out))
        numerator = reserve_in * amount_out
        denominator = (reserve_out - amount_out) * fee
        # Round up to ensure enough input to cover output
        return int(numerator / denominator + 1)


    def estimate(self, t_path, amount_in_wei:int, function ='getAmountsIn'):
        # or cash_to_qty estimate token in and out
        if amount_in_wei < 1:
            raise ValueError(f"Invalid amount_in_wei: {amount_in_wei}, should be greater or equal to 1")
            return [], [0]
        else:
            amount_in_wei = int(amount_in_wei)
        
        (token_in, token_out) = t_path
        valid_path = [self.tokens[token_in][0], self.tokens[token_out][0]]
        amounts = [0,0]
        try:
            if function == 'getAmountsIn':
                amounts = [self.get_amount_in(amount_in_wei, token_in, token_out), amount_in_wei]
            else:
                amounts = [amount_in_wei, self.get_amount_out(amount_in_wei, token_in, token_out)]
        except Exception as e:
            print(f"Error estimating amounts for {token_in} to {token_out}: {e}")
            return [], [0,0]
        return valid_path, amounts

    # todo: 
    def swap_exact_out(self, account:Account, path:list=['APT','USDT'], amount_out:int=1000000, amount_in_max:int=None):
        # remember estimate is not combined with gas fee, so it not accurate for price calculation
        if amount_out < 0:
            raise Exception('Invalid amount_out')

        sell_token, buy_token = path

        # Get valid path
        add_path, est_amounts_outs = self.estimate(path, amount_out, function='getAmountsIn')

        if amount_in_max is None:
            amount_in_max = int(est_amounts_outs[0] * 1.1)

        # Check register
        run_async(self.token_registered(account, sell_token))
        run_async(self.token_registered(account, buy_token))

        # Init transaction parameters
        router_module = self.router_address + "::router"
        payload = EntryFunction.natural(
            router_module,
            "swap_exact_output",
            [
                TypeTag(StructTag.from_str(add_path[0])),
                TypeTag(StructTag.from_str(add_path[1])),
            ],
            [
                TransactionArgument(amount_out, Serializer.u64),
                TransactionArgument(amount_in_max, Serializer.u64)
            ]
        )

        txn_hash = run_async(self.send_tx(account, payload))
        return txn_hash

    def swap_exact_in(self, account:Account, path:list=['APT','USDT'], amount_in:int=1000000, amount_out_min:int=0):
        # remember estimate is not combined with gas fee, so it not accurate for price calculation
        if amount_in < 0:
            raise Exception('Invalid amount_in')
        sell_token, buy_token = path

        # Get valid path
        add_path, est_amounts_outs = self.estimate(path, amount_in, function='getAmountsOut')

        if amount_out_min is None:
            amount_out_min = int(est_amounts_outs[-1] * 0.9)

        # Check register
        run_async(self.token_registered(account, sell_token))
        run_async(self.token_registered(account, buy_token))

        # Init transaction parameters
        router_module = self.router_address + "::router"
        payload = EntryFunction.natural(
            router_module,
            "swap_exact_input",
            [
                TypeTag(StructTag.from_str(add_path[0])),
                TypeTag(StructTag.from_str(add_path[1])),
            ],
            [
                TransactionArgument(amount_in, Serializer.u64),
                TransactionArgument(amount_out_min, Serializer.u64)
            ]
        )

        txn_hash = run_async(self.send_tx(account, payload))
        return txn_hash

    async def get_receipt(self, txn_hash:str, wait:bool):
        if wait:
            await self.gateway.wait_for_transaction(txn_hash)
        
        try:
            return await self.gateway.transaction_by_hash(txn_hash)
        except Exception as e:
            print("transaction not ready")
            return None

    
    def update_order(self, order:Order, wait_update:bool=False):
        """Get order info by orderId"""
        print(f"Updating order: {order.id}, tx: {order.tx}")
        receipt = run_async(self.get_receipt(order.tx, wait_update))
        gas_used = events = None

        if receipt is None: 
            print(f"receipt not ready {order.tx}")
            return None
        elif getattr(receipt, "success", False) is False:
            print(f"Transaction failed for tx: {order.tx}")
            order.status = 'Failed'
            return order
        else:
            gas_used = int(receipt.get('gas_used', 0))
            gas_price = int(receipt.get('gas_unit_price', 0))
            events = receipt.get('events', [])
            if gas_used == 0 or len(events) == 0:
                print(f"receipt events not ready {order.tx}")
                return None

        try:
            amount_in = 0
            amount_out = 0
            for e in events:
                if "swap::SwapEvent" in e.get('type', ""):
                    amount_x_in = int(e['data']['amount_x_in'])
                    amount_x_out = int(e['data']['amount_x_out'])
                    amount_y_in = int(e['data']['amount_y_in'])
                    amount_y_out = int(e['data']['amount_y_out'])

                    amount_in = amount_x_in + amount_y_in
                    amount_out = amount_x_out + amount_y_out
                    break

            amount_in_readable = self.from_wei(order.token_in, amount_in)
            amount_out_readable = self.from_wei(order.token_out, amount_out)

            price = amount_in_readable / amount_out_readable if order.side == 'buy' else amount_out_readable / amount_in_readable
            fee = gas_used * gas_price

            order.price = price
            order.amount_in = amount_in_readable
            order.amount_out = amount_out_readable
            order.qty = amount_out_readable if order.side == 'buy' else amount_in_readable
            order.value = amount_in_readable if order.side == 'buy' else amount_out_readable

            order.type = 'market'  
            ts = int(receipt.get('timestamp', time.time()))
            order.create_time = ts
            order.filled_time = ts
            order.status = 'Filled'
            order.fee = fee
            return order
        except Exception as e:
            print(f"receipt not ready for parse: {e}")
            print("receipt: ", receipt)
            return None

    def place_order(self, order_plan: OrderPlan, bot: TradingBot) -> Order:
        """
        todo: use swapETHForExactTokens and swapExactTokensForETH for bester perform
        gas compare https://bloxy.info/functions/791ac947 and https://bloxy.info/functions/7ff36ab5
        parameters:
        - side: buy or sell
        - pair: pair to trade
        - size: size of the order in USDT
        - price: current price of token/USDT for estimating qty
        - type: market or limit
        - limit: limit price for limit order should check current price not overcome limit yet
        - stop_price, sl_price, tp_price, parent_trade, tag: not used yet
        - parent_trade: trade to open/close position
        return:
        - id:
        - side: buy or sell
        - symbol: symbol
        - orderType: market or limit
        - avgPrice: average price of the order
        - qty: qty of the order
        - cumExecValue: total value of the order
        - cumExecQty: total qty of the order 
        - cumExecFee: total fee of the order
        """ 
        # todo:fee = amountin + chain fee
        # print("Placing order: ", order_plan)
        try:
            tx = None
            if order_plan.side == 'buy':
                amount = self.to_wei(order_plan.pair[0], order_plan.qty)
                path = order_plan.pair
                # tx = self.swap_exact_out(
                #     account=bot.account,
                #     path=path,
                #     amount_out=amount,
                #     amount_in_max=None  # order_plan.estimated_amount
                # )
                tx = self.swap_exact_in(
                    account=bot.account,
                    path=path,
                    amount_in=amount,
                    amount_out_min=0  # order_plan.estimated_amount
                )
            elif order_plan.side == 'sell':
                amount = self.to_wei(order_plan.pair[-1], order_plan.qty)
                path = order_plan.pair[::-1]
                tx = self.swap_exact_in(
                    account=bot.account,
                    path=path,
                    amount_in=amount,
                    amount_out_min=0  # order_plan.estimated_amount
                )

            order = Order(
                id=str(ulid.new()), 
                category=bot.category,
                pair=order_plan.pair,
                side=order_plan.side,
                broker=self,
                tx=tx,
                estimated_amount=getattr(order_plan,'estimated_amount', None)
            )
            print(f"Order id: {order.id}, tx: {tx}")
            return order

        except Exception as e:
            print("Order failed: ", e)
            # raise ValueError("Order failed")

      
if __name__ == "__main__":

    with open('configs/aptos_chain.yaml', 'r') as file:
        chain_info = yaml.safe_load(file)

    print("test Aptos Broker")
    chain = chain_info.get('mainnet', {})

    broker = PancakeBroker(
        rpcs=chain.get('rpcs'),
        ecosystem_token='APT',
        contract_info=chain.get('contracts'),
    )
    bot = TradingBot(
        wallet_key=chain.get('wallet', {}).get('private', ''),
        tokens=['APT', 'ETH'],
        currency='USDT',
        call_budget=1,
        invest_amount=10,
        balance=None,
        broker=broker,
        category='spot',
        strategy=None,
        interval='1h',
        db=None
        
    )


    # print(broker.get_pair_info(['APT', 'USDT']))
    print(broker.check_balance(
        bot=bot,
    ))

    buy_path, amounts = broker.estimate(['USDT', 'APT'], broker.to_wei('USDT', 1))
    print(buy_path, amounts)
    
    print(broker.estimate(['USDT', 'APT'], int(amounts[-1]), function='getAmountsIn'))
    
    # print("swap_exact_out: \n", broker.swap_exact_out(
    #     account=bot.account,
    #     path=['APT', 'USDT'],
    #     amount_out=broker.to_wei('USDT', 0.01),
    #     amount_in_max=None
    # ))
    
    # print("swap_exact_in: \n", broker.swap_exact_in(
    #     account=bot.account,
    #     path=['APT', 'USDT'],
    #     amount_in=broker.to_wei('APT', 0.01),
    #     amount_out_min=None
    # ))
    # order_details = OrderPlan(
    #     account=bot.account,
    #     side='buy',
    #     pair=['APT', 'USDT'],
    #     qty=0.01,
    # )
    # order = broker.place_order(
    #     order_details,
    #     bot
    # )
    order = Order(
        id = "apt_test",
        category='spot',
        pair=['USDT', 'APT'],
        side="buy",
        broker=broker,
        tx = "0xf434b8d5805aff7869a1c1a66458850c586c61c06362ab40afc9a40922eadbbb"
    )
    print(order, 
          order.tx, 
          order.fee,
          order.status,
          order.create_time,
          order.filled_time,
    )

    order.update_info(wait_update=True)

    print(order, 
          order.tx,
          order.fee,
          order.status,
          order.create_time,
          order.filled_time,
    )
