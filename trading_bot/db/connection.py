import os,dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# load environment variables
dotenv.load_dotenv()
DB_URL = os.getenv('DB_URL', 'sqlite:///trade_bot.db')

_engine = None
_SessionLocal = None

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            DB_URL,
            pool_pre_ping=True,   # checks connection before using
            pool_recycle=1800,    # optional: avoids stale timeouts
            connect_args={"check_same_thread": False} if "sqlite" in DB_URL else {},
        )
    return _engine

def get_session() -> Session:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal()