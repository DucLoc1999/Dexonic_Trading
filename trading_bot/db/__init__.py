import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, inspect
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from db.connection import get_engine
from db.models.order import Order
from db.models.trade import Trade 
Base = declarative_base()

def init_db():
    engine = get_engine()
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    if 'trades' not in existing_tables:
        print("Creating 'trades' table...")
        Trade.__table__.create(bind=engine, checkfirst=True)
    if 'orders' not in existing_tables:
        print("Creating 'orders' table...")
        Order.__table__.create(bind=engine, checkfirst=True)
