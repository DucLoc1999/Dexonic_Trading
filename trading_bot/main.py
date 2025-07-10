from datetime import datetime
import json
from shlex import quote
import sys
import time
from apscheduler.schedulers.blocking import BlockingScheduler

import pandas as pd
import requests
import talib
import yaml
from db import init_db
from lib.trading import Order, Trade, TradingBot, Strategy,OrderPlan
from lib.broker.dex.aptos_pancake import PancakeBroker
from db.connection import get_engine, get_session
from db.models.order import Order as OrderModel
from db.models.trade import Trade as TradeModel

current = time.time()

class MyStrategy(Strategy):
    def __init__(self, interval:str, db_engine):
        # order -> add parent trade id | state new / open / closed
        self.order_queue = []
        tf = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400,
            '1D': 86400,
        }
        tables = {
            'p5m': 'proddb.coin_prices_5m',
            'p1h': 'proddb.coin_prices',
            'f5m': 'proddb.f_coin_signal_5m',
            'f10m': 'proddb.f_coin_signal_10m',
            'f15m': 'proddb.f_coin_signal_15m',
            'f30m': 'proddb.f_coin_signal_30m',
            'f1h': 'proddb.f_coin_signal_1h',
            'f4h': 'proddb.f_coin_signal_4h',
            'f1d': 'proddb.f_coin_signal_1d',
            'f1D': 'proddb.f_coin_signal_1d',
            'orders': 'proddb.trade_orders_sim',
            'tp_by_sess': 'proddb.trade_orders_tp_by_session',
            'predict': 'proddb.coin_predictions',
            'predict_test': 'test.coin_predictions',
            }
        ts = tf.get(interval)
        table = tables.get(f'f{interval}')
        if ts is None or table is None:
            raise ValueError(f"Unsupported interval: {interval}")

        super().__init__(
            interval=interval,
            ts=ts,
            table=table,
            db_engine=db_engine)

    def get_data(self, tokens: list, currency: str) -> pd.DataFrame:
        """
        Get market data for the given tokens
        """
        current = int(time.time()) + 5

        networks = 'aptos'
        timeframe = 'minute'
        api_url = "https://api.geckoterminal.com/api/v2/networks/{networks}/pools/{pool}/ohlcv/{timeframe}"
        params = {
            "aggregate":5, # time period to aggregate for each ohlcv 
            "before_timestamp":current, # end time in seconds, should be current time
            "limit":30, # number of intervals to return, max 1000
            "currency": "usd",
            "include_empty_intervals": "true", # populate the OHLCV values for empty intervals (default: false)
            "token": "base" # return ohlcv for quote or base default is base
        }

        pools = {
            "APT":["0x925660b8618394809f89f8002e2926600c775221f43bf1919782b297a79400d8", 'quote'],
            "CAKE":["0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::swap::TokenPairReserve<0x159df6b7689437016108a019fd5bef736bac692b6d4a1f10c941f6fbb9a74ca6::oft::CakeOFT, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC>", 'base'],
            "WETH":["0x31a6675cbe84365bf2b0cbce617ece6c47023ef70826533bde5203d32171dc3c::swap::TokenPairReserve<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC, 0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH>", 'base'],
        }
        
        rsi_period = 14
        data = []
        for token in tokens:
            params["token"] = pools[token][1]
            
            response = requests.get(
                api_url.format(networks=networks, pool=pools[token][0], timeframe=timeframe),
                params=params,
                headers={
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            )
            if response.status_code != 200:
                raise Exception(f"Error {response.status_code}: {response.text}")

            # Parse OHLCV
            raw_data = response.json()
            candles = raw_data.get("data", {}).get("attributes", {}).get("ohlcv_list", [])

            # Create DataFrame
            df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            df[['open', 'high', 'low', 'close', 'volume']] = df[['open', 'high', 'low', 'close', 'volume']].astype(float)

            # Calculate RSI
            df[f'rsi{rsi_period}'] = talib.RSI(df['close'], timeperiod=rsi_period)
            df['symbol'] = token+currency  # Assuming single token for simplicity
            data.append(df)
        # Concatenate all dataframes
        result_df = pd.concat(data, ignore_index=True)
        return result_df

    def run(self, pair: list, data: pd.DataFrame, budget: float, bot: TradingBot) -> OrderPlan | None:
        """
        chu cycle: 5m
        open: rsi14 < 25
        close: rsi14 > 70
        """
        print(f'Running strategy: {self.__class__.__name__} with pair: {pair} and budget: {budget} and data: {data.shape[0]} rows')
        
        # get bot info
        print(data.tail(5))
        rsi = data['rsi14'].values
        print(f'RSI values: {rsi[-5:]}')
        
        amount=budget
        price = float(data['close'].iloc[-1])
        qty = amount  # calculate qty based on last close price
        if (rsi[-1] < 25):
            print(f"Buy signal for {pair} at price {price}, qty {qty}")
            bot.buy(pair=pair, price=price, qty=qty, estimated_amount=amount)
            self.flag = 'sell'  # switch flag to sell after buy signal
        # close trades on sell signal
        elif (rsi[-1] > 70):
            print(f"Sell signal for {pair} at price {price}, qty {qty}")
            bot.sell(pair=pair, price=price)
        else:
            print("No signal")
        return None

def bot_run(bot: TradingBot):
    bot.run()
    bot.checking_orders()
    num_process_trade = sum([len(v) for k, v in bot.process_trades.items()])
    if num_process_trade > 0:
        print(f"Processing {num_process_trade} trades: {bot.process_trades}")
    i = 0
    while i < 3 and num_process_trade > 0:
        bot.checking_orders()
        num_process_trade = sum([len(v) for k, v in bot.process_trades.items()])
        i += 1
        time.sleep(5)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print('Time', now, " - process trades: ",bot.checking_orders(), "open trades: ", bot.open_trades, "history trades: ", bot.history_trades)

# todo: on working version try in testnet mode
if __name__ == '__main__':
    init_db()
    # =========== Load Chain Configuration ===========
    with open('configs/aptos_chain.yaml', 'r') as file:
        chain_info = yaml.safe_load(file)
    chain = chain_info.get('mainnet', {})  # testnet or 'mainnet'

    currency = 'USDT'  # default currency to trade
    native_token='APT'  # have data but can't trade yet todo: use in future
    ecosystem_token='APT'  # current no data
    supported_tokens=list(set(chain.get('contracts').get('tokens').keys())-set(['router','factory','USDT']))
    print(f"Supported tokens: {supported_tokens}")

    try:
        if len(sys.argv) < 2:
            raise Exception("No token provided")
        trade_tokens = [str(t).strip() for t in sys.argv[1:]]
        trade_tokens = list(set(trade_tokens) & set(supported_tokens))

    except Exception as e:
        print(e)
        print("Using default token: APT")
        trade_tokens = ['APT']  # default token to trade

    print(f"Trading token: {trade_tokens}")

    # =========== Initialize objects ===========
    broker = PancakeBroker(
        rpcs=chain.get('rpcs'),
        ecosystem_token=ecosystem_token,
        contract_info=chain.get('contracts'),
    )
    db = get_session()
    engine = get_engine()
    strat = MyStrategy(
        interval='5m',
        db_engine=engine)
    bot = TradingBot(
        id='test_aptusdt',
        wallet_key=chain.get('wallet', {}).get('private', ''),
        tokens=trade_tokens,
        currency='USDT',
        call_budget=0.1,
        invest_amount=7,
        balance=None,
        broker=broker,
        category='spot',
        strategy=strat,
        db=db,
        notif_on = False
    )
    print("bot account address: ", bot.account.address())
    # print(broker.tokens, json.loads(broker.tokens["APT"][1])['data']['decimals'])

    # === SCHEDULER ===
    scheduler = BlockingScheduler()
    try:
        # Run at 5 minute 
        # for minute in range(0, 60, 5):
        scheduler.add_job(
            bot_run,
            trigger='cron',
            minute='0-55/5',
            second=20, # thong thuong du lieu 5p co sau 9-10s 
            kwargs={'bot': bot},
        )
        scheduler.start()
    except Exception as e:
        if isinstance(e, KeyboardInterrupt):
            print("Process interrupted by user.")
        else:
            print(f"An error occurred: {e}")

        print("Shutting down scheduler…")
        scheduler.shutdown(wait=False)  # stop scheduling new runs
        # Wait for running jobs to finish
        while scheduler.get_jobs():
            print(f"Waiting for {len(scheduler.get_jobs())} jobs to complete…")
            time.sleep(1)
        print("All jobs done. Exiting.")
        sys.exit(0)

