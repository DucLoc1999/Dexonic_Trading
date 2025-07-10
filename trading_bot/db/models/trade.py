# models/trade.py

from typing import List
from sqlalchemy import Column, String, Integer, Float, Double, ForeignKey
from sqlalchemy.dialects.mysql import DOUBLE, FLOAT
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from db.models.base import Base, ORMModel

class Trade(ORMModel, Base):  # Must inherit in order to use ORMModel __init__ and methods
    __tablename__ = "trades"
    # __table_args__ = {'schema': 'trade_bot'}

    id:Mapped[str] = mapped_column(String(50), primary_key=True)
    bot_id:Mapped[str] = Column(String(50), nullable=True)
    pair:Mapped[str] = Column(String(50), nullable=True)
    direction:Mapped[str] = Column(String(25), nullable=False)
    entry_order_id:Mapped[str] = mapped_column(String(50), ForeignKey("orders.id"), nullable=True)  # Foreign key to orders table
    exit_order_id:Mapped[str] = mapped_column(String(50), ForeignKey("orders.id"), nullable=True)  # Foreign key to orders table
    invested_amount:Mapped[float] = Column(FLOAT(unsigned=True), nullable=True)
    position_size:Mapped[float] = Column(DOUBLE(unsigned=True), nullable=True)
    net_return:Mapped[float] = Column(FLOAT(unsigned=True), nullable=True)
    profit:Mapped[float] = Column(FLOAT(unsigned=True), nullable=True)
    entry_price:Mapped[float] = Column(FLOAT(unsigned=True), nullable=True)
    exit_price:Mapped[float] = Column(FLOAT(unsigned=True), nullable=True)
    entry_time:Mapped[int] = Column(Integer, nullable=True)
    exit_time:Mapped[int] = Column(Integer, nullable=True)
    status:Mapped[str] = Column(String(15), nullable=True)

    # Relationships
    entry_order = relationship("Order", back_populates="entry_trades", foreign_keys=entry_order_id)
    exit_order = relationship("Order", back_populates="exit_trades", foreign_keys=exit_order_id)

    def __repr__(self):
        return f"<Trade(id={self.id}, pair={self.pair}, direction={self.direction}, entry_price={self.entry_price}, exit_price={self.exit_price}, status={self.status})>"
    
