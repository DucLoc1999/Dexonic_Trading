from abc import ABC, abstractmethod
import time
from typing import Optional, Tuple, Union
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from db.models.order import Order as OrderModel
from db.models.trade import Trade as TradeModel
import ulid

import warnings
warnings.filterwarnings('ignore')

class OrderPlan():
    def __init__(self, action:str, side:str, pair:list, **kwargs) -> None:
        """
        Order plan is a template for order, it can be used to create order later
        It will go with Bot or any entity need to place order for adding more details
        """
        self.pair = pair  # pair of tokens, ['quote', 'base'] like ['USDT', 'BTC']
        self.side = side  # 'buy' or 'sell'
        self.action = action  # 'open' or 'close'
        # id Optional[str] = None,  # order id, if None, will be generated later
        # trade_id: Optional[str] = None,  # trade id, if None, will be generated later
        # estimated_amount: Optional[float] = None,  # estimated amount of the order in USDT = qty * estimated_price
        # price, qty, type, 
        ### Addition features:
        # bot_id, category, wallet, open_trade, history_trade
        for key, value in kwargs.items():
                setattr(self, key, value)

    def __repr__(self):
        return f"OrderPlan({self.action}, {self.side}, {self.pair})"

class BaseBroker(ABC):
    def __init__(self, 
                spread: float = .0,
                commission: Union[float, Tuple[float, float]] = .0,
                margin: float = 1.,
                trade_on_close=False,
                hedging=False,
                exclusive_orders=False,
                # index: Optional[pd.Index] = None,
                ) -> None:
        self.spread=spread
        self.commission=commission
        self.margin=margin

    @abstractmethod
    def update_order(self, order: Optional['Order']) -> dict:
        """
        Get order info
        """
        pass

    def get_pair_info(self, pair: list):
        # t2, t1 = symbol.split('/')
        res = {
            # 'baseCoin': t1,
            # 'quoteCoin': t2,
            'minPrice': 5.0,
            'tickSize': 0.01,
            'minOrderQty': 1e-8,
            'qtyStep': 1e-8
        }
        return res

        return
    
    def cash_to_qty(self, symbol:str, cash: float, price: float) -> float:
        """
        Convert cash to qty
        """
        pair_info = self.get_pair_info(symbol)
        qp = pow(10, pair_info['qtyStep'])

        qty = int(cash/price*qp)/qp
        if qty < pair_info['minOrderQty']:
            raise ValueError("not enough qty, size too small", qty, self.coin_info['minOrderQty'], qp, self.coin_info['qtyStep'])
        return qty
    
    @abstractmethod
    def place_order(self, order_plan: OrderPlan, bot: 'TradingBot') -> 'Order':
        """
        Place order
        """
        # todo: place order
        pass
    
    @abstractmethod
    def check_balance(self, bot: 'TradingBot') -> Tuple[float, float]:
        """
        Check the balance of the bot
        """
        # return balance, pending_money (money in open orders)
        return 0.0, 0.0

    @abstractmethod
    def load_account(self, wallet_key:str):
        pass

class Order():
    def __init__(self, id:str, category:str, pair:list, side:str, broker:BaseBroker, **kwargs) -> None:
        """
        pair(symbol) -> path: [base, quote] -> buy [quote, base] or sell [base, quote]
        token_in -> token_sell
        token_out -> token_buy
        """
        self.id = id
        self.category = category # 'spot', 'futures', 'options', etc. 
        self.pair = pair
        self.symbol = ''.join(pair[::-1]) if isinstance(pair, list) else pair  # ex 'BTCUSDT' or 'BTC/USDT', 'BTC-USDT'
        self.side = side # 'buy' or 'sell'

        # token is like 'BTC', 'ETH', 'USDT', etc. 
        if self.side not in ['buy', 'sell']:
            raise ValueError("side must be 'buy' or 'sell'")
        elif self.side == 'buy':
            self.token_in, self.token_out = pair[0], pair[1]
        else:
            self.token_in, self.token_out = pair[1], pair[0]
        self.status = 'new'  # 'new', 'partially_filled', 'filled', 'canceled', 'rejected', 'triggered', 'deactivated', etc.
        self._broker = broker

        self.price = None       # float: price of the order
        self.amount_in = None   # float: amount of the token_in in ether
        self.amount_out = None  # float: amount of the token_out in ether
        self.type = None        # 'market', 'limit', 'stop', 'stop_limit', etc.
        self.create_time = None # int|timestamp: time when the order was created
        self.filled_time = None # int|timestamp: time when the order was filled
        self.status = None      # 'new', 'partially_filled', 'filled', 'canceled', 'rejected', 'triggered', 'deactivated', etc.
        # setting extended attributes
        for key, value in kwargs.items():
            # print(f"Setting {key} to {value} in Order")
            setattr(self, key, value)

        self.update_info()
    
    def __repr__(self):
        return f"Order({self.id}, {self.category}, {self.symbol}, {self.side}, {self.status}, tx: {getattr(self, 'tx', '')})"

    def update_info(self, wait_update:bool=False):
        self._broker.update_order(
            self,
            wait_update
        )

    def is_filled(self):
        if self.status not in ['Rejected', 'PartiallyFilledCanceled', 'Filled', 'Cancelled', 'Triggered', 'Deactivated']:
            self.update_info()
            if self.status not in ['Rejected', 'PartiallyFilledCanceled', 'Filled', 'Cancelled', 'Triggered', 'Deactivated']:
                return False
        return True
    
    # id,bot_id,pair,direction,entry_order_id,exit_order_id,invested_amount,position_size,net_return,profit,entry_price,exit_price,entry_time,exit_time,status

class Trade():
    def __init__(self, id:str, broker:BaseBroker) -> None:
        self.id = id
        self.status = 'new'
        self._broker = broker
        self.order_plan = None  # OrderPlan for opening the trade
        self.open_order = None
        self.close_order = None


    def set_close_order(self, order: Order) -> None:
        self.close_order_id = order.id
        self.pair = order.symbol
        if self.close_order_id is None:
            raise ValueError("Order ID is required to create a trade")
        self.close_order = order
        self.is_close()
        
    def set_open_order(self, order: Order) -> None:
        self.open_order_id = order.id
        if self.open_order_id is None:
            raise ValueError("Order ID is required to create a trade")
        self.open_order = order
        self.direction = 'long' if self.open_order.side == 'buy' else 'short'
        self.is_open()

    def is_open(self):
        if self.open_order.is_filled():
            self.invested_amount = self.open_order.amount_in if self.open_order.side == 'buy' else  self.open_order.amount_out
            self.position_size = self.open_order.amount_out if self.open_order.side == 'buy' else  self.open_order.amount_in
            self.entry_price = self.open_order.price
            self.entry_time = self.open_order.filled_time
            self.status = 'open'
            return True
        else:
            return False
        
    def is_close(self):
        if self.close_order.is_filled():
            self.net_return = self.close_order.amount_out if self.close_order.side =='sell' else self.close_order.amount_in
            self.profit = self.close_order.amount_out - self.open_order.amount_in if self.direction == 'long' else self.open_order.amount_out - self.close_order.amount_in
            self.exit_price = self.close_order.price
            self.exit_time = self.close_order.filled_time
            self.status = 'close'
            return True
        else:
            return False

    def __repr__(self):
        return f"Trade({self.id}, {getattr(self.open_order, 'symbol', None)}, {self.direction}, {self.status}, {getattr(self.open_order, 'price', None)}, {getattr(self.close_order, 'price', None)})"

class Strategy(ABC): # base template for strategy
    def __init__(self, *args, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    @abstractmethod
    def get_data(self, tokens:list, currency:str, interval:str) -> pd.DataFrame:
        """
        Get market data for the given tokens
        :param tokens: list of tokens to get data for
        :param currency: base currency for the data
        :param interval: time interval for the data
        :return: DataFrame containing the market data
        """
        pass

    @abstractmethod
    def run(self, pair: list, data: pd.DataFrame, budget: float, bot: 'TradingBot') -> OrderPlan | None:
        """
        Run the strategy
        :param pair: list of tokens in the pair, like ['USDT', 'BTC'], buy side USDT -> BTC, trade to increase USDT amount
        :param bot: TradingBot instance for addition details
        """
        pass

class TradingBot():
    def __init__(self, id:str, wallet_key:str, tokens=[], currency:str='USDT', call_budget:float=5, invest_amount:float=10_000,
            balance:float=None, broker: BaseBroker = None, category:str='spot', strategy:Strategy=None, 
            default_order_timeout:float = 60*15, db:Session=None, notif_on:bool = True, **kwargs) -> None:
        self.id = id
        self.tokens = tokens if tokens is not None else []  # Safe initialization
        if currency in self.tokens:
            self.tokens.remove(currency)
        self.currency = currency
        self._broker = broker
        self.call_budget = call_budget
        self.invest_amount = invest_amount
        self.balance = balance or invest_amount
        self.category = category
        self.pending_money = 0
        self.open_trades = {}
        self.process_trades = {
            'opening': [],      # Orders being opened (processing)
            'closing': [],      # Orders being closed (processing)
            'waiting': []       # Limit orders waiting for price or timeout
        }
        self.history_trades = []
        self.strategy = strategy
        self.account = self._broker.load_account(wallet_key)
        self.db = db # todo: use db to save/load state, write orders and trades and logs
        self._token_balance = {} # todo: use token balance for crypto trading
        for key, value in kwargs.items():
            setattr(self, key, value)
        
        self.update_balance()  # update balance and pending_money
        self.fund = {}
        self.config_fund_rate({token:1.0 for token in self.tokens})  # default fund rate for each token is 1.0
        self.order_queue = []
        self.default_order_timeout = default_order_timeout
        self.notif_on:bool = bool(notif_on)  # whether to send notifications about trades

    def write_order(self, order: Order) -> None:
        """
        Write order to database or update existing order
        Parameters:
        order : Order
            Order object to write to database
        """
        try:
            # Check if order already exists in DB
            existing_order = OrderModel.get_by_id(order.id)
            if existing_order:
                # Update existing order
                existing_order.update(
                    symbol=order.symbol,
                    side=order.side,
                    price=order.price,
                    token_in=order.token_in,
                    token_out=order.token_out,
                    amount_in=order.amount_in,
                    amount_out=order.amount_out,
                    type=order.type,
                    create_time=order.create_time,
                    filled_time=order.filled_time,
                    tx=getattr(order, 'tx', None),
                    tx_link=getattr(order, 'tx_link', None)
                )
            else:
                # Create new order in DB
                OrderModel.create(
                    id=order.id,
                    symbol=order.symbol,
                    side=order.side,
                    price=order.price,
                    token_in=order.token_in,
                    token_out=order.token_out,
                    amount_in=order.amount_in,
                    amount_out=order.amount_out,
                    type=order.type,
                    create_time=order.create_time,
                    filled_time=order.filled_time,
                    tx=getattr(order, 'tx', None),
                    tx_link=getattr(order, 'tx_link', None)
                )
        except Exception as e:
            print(f"Error writing order to database: {e}")

    def write_trade(self, trade) -> None:
        """
        Write trade to database or update existing trade
        
        Parameters:
        trade : Trade
            Trade object to write to database
        """
        try:
            # Extract trade data
            trade_data = {
                'bot_id': self.id,
                'pair': trade.open_order.symbol,
                'direction': trade.direction,
                'entry_order_id': trade.open_order_id,
                'invested_amount': trade.invested_amount,
                'position_size': getattr(trade, 'position_size', 0),
                'entry_price': getattr(trade, 'entry_price', 0),
                'entry_time': getattr(trade, 'entry_time', 0),
                'status': trade.status
            }
            
            # If trade is closed, add exit information
            if hasattr(trade, 'close_order') and trade.close_order:
                trade_data.update({
                    'exit_order_id': trade.close_order_id,
                    'net_return': getattr(trade, 'net_return', 0),
                    'profit': getattr(trade, 'profit', 0),
                    'exit_price': getattr(trade, 'exit_price', 0),
                    'exit_time': getattr(trade, 'exit_time', 0),
                })
            
            # Generate trade ID if needed
            if not trade.id:
                # Create a unique ID from timestamp and pair
                trade.id = f"{trade.open_order.symbol}{trade.entry_time}"
            
            trade_data['id'] = trade.id
            
            # Check if trade already exists in DB
            existing_trade = TradeModel.get_by_id(trade.id)
            
            if existing_trade:
                # Update existing trade
                existing_trade.update(**trade_data)
            else:
                # Create new trade in DB
                TradeModel.create(**trade_data)
                
        except Exception as e:
            print(f"Error writing trade to database: {e}")        

    def save_state(self) -> None:
        # todo: [unnecessary - do if have free time]
        # save undone state to DB
        # remove all order and trade have bot id and write new
        pass

    def load_state(self, id) -> None:
        # todo: [unnecessary - do if have free time]
        # load state from DB
        pass

    def update_balance(self):
        """ Check the balance of the bot
        calcualte the _token_balance then adjust the value of:
        - balance: total amount of money in the bot
        - pending_money: money in open orders
        """
        # check balance, pending_money, _token_balance
        self.balance,self.pending_money = self._broker.check_balance(self)
        
        return self.balance, self.pending_money

    def config_fund_rate(self, config:dict) -> dict:
        for token, weight in config.items():
            if token not in self.fund.keys():
                self.fund[token] = {
                    'weight': weight,
                    'total': 0.,
                    'cash': 0.,
                    'invested': 0.,
                    'pending': 0.,
                }
            else:
                self.fund[token]['weight'] = weight
        return self.update_fund()

    def update_fund(self):
        """
        Update the fund allocation for each token based on weights
        and current token balances
        """
        t_weight = 0
        for token, info in self.fund.items():
            t_weight += info['weight']
        
        for token, info in self.fund.items():
            # Calculate target allocation based on weights
            total = info['weight']*self.invest_amount / t_weight
            
            # Set the invested amount as current token value
            invested = self._token_balance.get(token, {}).get('value', 0)
            
            # Calculate remaining cash allocation
            cash = total - invested
            
            # Update fund information
            self.fund[token]['total'] = total
            self.fund[token]['invested'] = invested
            self.fund[token]['cash'] = cash
            # Ensure pending is initialized
            if 'pending' not in self.fund[token]:
                self.fund[token]['pending'] = 0
        
        return self.fund
    
    def checking_orders(self):
        """
        Check and process trades in opening, closing, and waiting queues
        Updates trade status, fund allocations, and balances
        """
        current_time = time.time()
        # Check waiting orders (limit orders with time constraints)
        for trade in self.process_trades['waiting'][:]:
            # All waiting trades have an order_plan with action 'open' or 'close'
            if hasattr(trade, 'order_plan'):
                order_plan = trade.order_plan
                target_price = getattr(order_plan, 'limit', None)
                current_price = self._broker.get_current_price(order_plan.pair)
                price_condition_met = False

                if order_plan.side == 'buy' and current_price <= target_price:
                    price_condition_met = True
                elif order_plan.side == 'sell' and current_price >= target_price:
                    price_condition_met = True

                # Check if time limit is exceeded
                time_exceeded = order_plan.exp_time > current_time

                if price_condition_met:
                    action = getattr(order_plan, 'action', None)
                    if action is None:
                        action = 'close' if getattr(trade, 'open_order', None) else 'open'

                    if action == 'open':
                        order = self._broker.place_order(order_plan, self)
                        trade.set_open_order(order)
                        self.process_trades['waiting'].remove(trade)
                        self.process_trades['opening'].append(trade)
                        # Write order to database
                        self.write_order(order)

                    elif action == 'close':
                        order = self._broker.place_order(order_plan, self)
                        trade.set_close_order(order)
                        self.process_trades['waiting'].remove(trade)
                        self.process_trades['closing'].append(trade)
                    # Write order to database
                    self.write_order(order)
                    
                elif time_exceeded:
                    print(f"Time limit exceeded for order {order_plan}")
                    # Return funds to cash if open, or move back to open_trades if close
                    if action == 'open':
                        token = order_plan.pair[1] if order_plan.side == 'buy' else order_plan.pair[0]
                        estimated_amount = getattr(order_plan, 'estimated_amount', 0)
                        
                        if token in self.fund and estimated_amount:
                            self.fund[token]['pending'] -= estimated_amount
                            self.fund[token]['cash'] += estimated_amount
                        self.process_trades['waiting'].remove(trade)
                        trade.order_plan.status = 'Cancelled'
                        trade.status = 'cancelled'
                    elif action == 'close':
                        # If closing, we might want to keep the trade in open_trades
                        symbol = ''.join(order_plan.pair[::-1]) 
                        if symbol not in self.open_trades:
                            self.open_trades[symbol] = []
                            trade.order_plan.status = 'Cancelled'
                        self.open_trades[symbol].append(trade)
                        self.process_trades['waiting'].remove(trade)

        # Check opening trades (standard logic)
        for trade in self.process_trades['opening'][:]:
            if trade.is_open():
                # Get token from pair
                token = trade.open_order.token_out if trade.open_order.side == 'buy' else trade.open_order.token_in
                symbol = trade.open_order.symbol
                 
                # Ensure symbol exists in open_trades
                if symbol not in self.open_trades:
                    self.open_trades[symbol] = []
                    
                # Add to open_trades
                self.open_trades[symbol].append(trade)
                
                # Remove from processing queue
                self.process_trades['opening'].remove(trade)
                
                print(self._token_balance)
                print(self.fund)
                # Move money from pending to invested in fund
                if token in self.fund:
                    # Ensure we don't subtract more than what's pending
                    amount = trade.invested_amount
                    estimated_amount = getattr(trade.open_order, 'estimated_amount', 0)
                    change = estimated_amount - amount  # can be negative if invested_amount is less than estimated_amount

                    self.fund[token]['pending'] -= estimated_amount
                    self.fund[token]['invested'] += amount
                    self.fund[token]['cash'] += change

                # Update bot's pending money
                self.pending_money -= amount

                # Write the trade and open order to DB
                self.write_order(trade.open_order)
                self.write_trade(trade)  # new trade
                
        # Check closing trades (standard logic)
        for trade in self.process_trades['closing'][:]:
            if trade.is_close():
                # Get token from trade
                token = trade.open_order.token_out if trade.open_order.side == 'buy' else trade.open_order.token_in
                
                # Add to history_trades
                self.history_trades.append(trade)
                
                # Remove from processing queue
                self.process_trades['closing'].remove(trade)
                
                # Update fund with trade results
                if token in self.fund:
                    # Remove the investment
                    self.fund[token]['invested'] = max(0, self.fund[token].get('invested', 0) - trade.invested_amount)
                    
                    # Add the net return to cash
                    self.fund[token]['cash'] += trade.net_return
                    
                # Update bot's balance
                self.balance += trade.net_return

                # Write the trade and open order to DB
                self.write_order(trade.close_order)
                self.write_trade(trade)  # update trade
        
        return self.process_trades

    def open_trade(self, order_plan) -> Trade:
        """
        Open a new trade based on an order plan
        
        Parameters:
        order_plan : OrderPlan
            Complete order plan with all necessary details
        """
        if not isinstance(order_plan, OrderPlan):
            raise TypeError("order_plan must be an instance of OrderPlan")
        
        # Get pair information
        pair = order_plan.pair
        token = pair[1] if order_plan.side == 'buy' else pair[0]  # Get token based on side
        
        # Estimate investment amount
        estimated_amount = getattr(order_plan, 'estimated_amount', None)
        if estimated_amount is None and hasattr(order_plan, 'qty') and hasattr(order_plan, 'price'):
            estimated_amount = order_plan.qty * order_plan.price
            order_plan.estimated_amount = estimated_amount

        # Verify we have enough cash in the fund
        if token in self.fund and estimated_amount:
            if self.fund[token]['cash'] < estimated_amount:
                raise ValueError(f"Not enough cash in fund for token {token}. Required: {estimated_amount}, Available: {self.fund[token]['cash']}")
            
        self.fund[token]['cash'] -= estimated_amount
        self.fund[token]['pending'] += estimated_amount

        # Create a trade object
        trade = Trade(id=str(ulid.new()), broker=self._broker)

        # Check if this is a market order or limit order with time constraint
        order_type = getattr(order_plan, 'order_type', 'market')
        
        if order_type == 'market':
            # Market order - process immediately
            order = self._broker.place_order(order_plan, self)
            trade.set_open_order(order)
            self.process_trades['opening'].append(trade)
        elif order_type == 'limit':
            time_limit = getattr(order_plan, 'time_limit', self.default_order_timeout)
            order_plan.exp_time = time.time() + time_limit
            # Limit order with time constraint
            trade.order_plan = order_plan
            trade.status = 'waiting'
            # Add the trade to waiting queue
            self.process_trades['waiting'].append(trade)
        else:
            # If order type is not market or limit, raise an error
            raise ValueError(f"Unknown order type {order_type} in order plan")        
        return trade

    def close_trade(self, trade:Trade=None, order_plan:OrderPlan=None) -> Union[Trade, list]:
        """
        Close trades according to an order plan
        
        Parameters:
        order_plan : OrderPlan
            Order plan with details for closing trades
        Returns:
        Trade or list of Trades
            The closed trade(s)
        """
        trades_to_close = []
        if trade is not None:
            trades_to_close = [trade]
            symbol = trade.open_order.symbol
        elif order_plan is not None:
            symbol = ''.join(order_plan.pair[::-1])
            trade_id = getattr(order_plan, 'trade_id', None)
            
            # If trade_id is specified in order_plan, close that specific trade
            if trade_id is not None:
                for trades in self.open_trades.get(symbol, []):
                    for trade in trades:
                        if trade.id == trade_id:
                            trades_to_close = [trade]
                            break
            # Otherwise close trades for the symbol
            else:
                trades_to_close = self.open_trades.get(symbol, []).copy()
        else:
            raise ValueError("Either trade or order_plan must be provided to close trades")
        
        # if no trades to close, return empty list
        if len(trades_to_close) == 0:
            return []
        
        # Close the trades
        closed_trades = []
        for trade in trades_to_close:
            # Get the token for updating fund allocation
            token = trade.open_order.token_out if trade.open_order.side == 'buy' else trade.open_order.token_in

            close_op = None
            # create a close order plan if not provided
            if order_plan is None:
                o_side = trades_to_close[0].open_order.side
                c_side = 'sell' if o_side == 'buy' else 'buy'
                close_op = OrderPlan(
                    action='close',
                    side=c_side,
                    pair=trades_to_close[0].open_order.pair,
                    order_type='market',  # Default to market order
                    qty=trade.open_order.amount_out # amount base token
                )
            else:
                close_op = order_plan # .copy()  # Create a copy of the order_plan to avoid modifying the original
                close_op.qty = trade.open_order.amount_out

            # Check if this is a market order or limit order with time constraint
            order_type = getattr(close_op, 'order_type', 'market')
            time_limit = getattr(close_op, 'time_limit', None)
            
            if order_type == 'market' or time_limit is None:
                # Market order - process immediately
                closed_order = self._broker.place_order(close_op, self)
                trade.set_close_order(closed_order)
                # Add to closing process queue
                self.process_trades['closing'].append(trade)
            else:
                # Limit order with time constraint
                trade.order_plan = order_plan
                trade.order_plan.status = 'waiting'
                # Add the trade to waiting queue for closing
                self.process_trades['waiting'].append(trade)
            
            # Remove from open_trades
            if symbol in self.open_trades and trade in self.open_trades[symbol]:
                try:
                    self.open_trades[symbol].remove(trade)
                except Exception as e:
                    print(f"Error removing trade {trade.id} from open_trades: {e}")
                
            closed_trades.append(trade)
        
        return closed_trades if len(closed_trades) > 1 else closed_trades[0] if closed_trades else None
    
    def buy(self, pair:list, price:float, qty:float, estimated_amount, **kwargs) -> Trade:
        order_plan = OrderPlan(
                pair=pair,
                side='buy',
                action='open',
                qty=qty,
                price=price,
                estimated_amount=estimated_amount
        )
        self.open_trade(order_plan=order_plan)

    def sell(self, pair:list, price:float, qty:float=None, estimated_amount=None, **kwargs) -> Trade:
        order_plan = OrderPlan(
            pair=pair,
            side='sell',
            action='close',
            qty=qty,
            price=price,
            estimated_amount=estimated_amount
        )           
        self.close_trade(order_plan=order_plan)
    
    def process_orders(self):
        """
        Process orders in the order queue
        Parameters:
        order_queue : list, optional
            List of order plans to process. If None, use self.order_queue
        Returns:
        list
            Processed trades
        """
        processed_trades = []
        order_queue = []
        if len(self.order_queue) > 0:
            order_queue = list(self.order_queue)  # Create a copy
            print("Processing order queue:", order_queue)
            self.order_queue.clear()  # Clear the queue

        for order_plan in order_queue:
            if not isinstance(order_plan, OrderPlan):
                raise TypeError("Items in order queue must be OrderPlan instances")
                
            try:
                if order_plan.action == 'open':
                    trade = self.open_trade(order_plan=order_plan)
                    processed_trades.append(trade)
                elif order_plan.action == 'close':
                    result = self.close_trade(order_plan=order_plan)
                    # Handle both single trade and list of trades
                    if isinstance(result, list):
                        processed_trades.extend(result)
                    elif result is not None:
                        processed_trades.append(result)
                else:
                    raise ValueError(f"Unknown action {order_plan.action} in order plan")
            except Exception as e:
                print(f"Error processing order plan: {e}")
                # Continue with next order

        return processed_trades
        
    def run(self):
        """
        Run the strategy
        
        Returns:
        list
            Processed trades
        """
        if self.strategy is None:
            raise ValueError("Strategy is not set")
        if not isinstance(self.strategy, Strategy):
            raise TypeError("Strategy must be an instance of Strategy class")
        
        # Get history with error handling
        # try:
        #     if self.db is not None:
        #         self.history = pd.read_sql_query(
        #             f'''SELECT * 
        #             FROM trade_bot.trades 
        #             WHERE bot_id = '{self.id}'
        #                 and status = 'open'
        #             ORDER BY entry_time ASC
        #             ''',
        #             self.db.connection().connection,
        #         )
        #     else:
        #         self.history = pd.DataFrame()
        # except Exception as e:
        #     print(f"Error loading trade history: {e}")
        #     self.history = pd.DataFrame()

        # Get data
        try:
            data = self.strategy.get_data(
                tokens=self.tokens, 
                currency=self.currency,
            )
        except Exception as e:
            print(f"Error getting market data: {e}")
            return []

        # check run trade strategy for each token pairs
        for t in self.tokens:
            # symbol base + quote, like 'BTCUSDT'
            symbol = t + self.currency
            df = data[data['symbol'] == symbol]  # todo: should be processed in better way, symbols should not be create here
            if df.empty:
                print(f"No data for symbol {symbol}: please check your strategy.get_data() implementation")
                continue
            pair = [self.currency, t]
            if self.call_budget < 1:
                budget = self.fund[t]['cash'] * self.call_budget
            else:
                budget = min(self.fund[t]['cash'], self.call_budget)
                
            # run strategy to get order_queue
            # order_plan = 
            self.strategy.run(
                pair,
                df,
                budget=budget,
                bot=self
            )
            # if order_plan is not None:
            #     if isinstance(order_plan, OrderPlan):
            #         self.order_queue.append(order_plan)
            #     else:
            #         raise TypeError("Order plan must be an instance of OrderPlan class")
        # process order_queue
        return self.process_orders()

 