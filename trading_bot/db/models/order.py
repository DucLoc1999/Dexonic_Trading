# models/order.py

from typing import List
from sqlalchemy import Column, String, Integer,Double, ForeignKey
from sqlalchemy.dialects.mysql import DOUBLE, FLOAT
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from db.models.base import Base, ORMModel

class Order(ORMModel, Base):  # Must inherit in order to use ORMModel __init__ and methods
    __tablename__ = "orders"
    # __table_args__ = {'schema': 'trade_bot'}

    id:Mapped[str] = mapped_column(String(50), primary_key=True)
    symbol:Mapped[str] = Column(String(50), nullable=True)
    side:Mapped[str] = Column(String(25), nullable=True)
    price:Mapped[float] = Column(DOUBLE(unsigned=True), nullable=True)
    token_in:Mapped[str] = Column(String(25), nullable=False)
    token_out:Mapped[str] = Column(String(25), nullable=False)
    amount_in:Mapped[float] = Column(DOUBLE(unsigned=True), nullable=True)
    amount_out:Mapped[float] = Column(DOUBLE(unsigned=True), nullable=True)
    type:Mapped[str] = Column(String(25), nullable=False)
    create_time:Mapped[int] = Column(Integer, nullable=True)
    filled_time:Mapped[int] = Column(Integer, nullable=True)
    tx :Mapped[str] = Column(String(50), nullable=True)
    tx_link:Mapped[str] = Column(String(255), nullable=True)

    # Optional reverse relationships:
    entry_trades = relationship("Trade", back_populates="entry_order", foreign_keys="Trade.entry_order_id")
    exit_trades = relationship("Trade", back_populates="exit_order", foreign_keys="Trade.exit_order_id")

    def __repr__(self):
        return f"Order(id={self.id}, symbol={self.symbol}, side={self.side}, price={self.price}, broker_tx={self.tx})"
    