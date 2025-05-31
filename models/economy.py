"""
RuneRogue Economy Models

SQLAlchemy models for the economy system including items, players,
trades, and grand exchange operations.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Numeric,
    Index,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class TradeStatus(Enum):
    """Trade status enumeration."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OfferType(Enum):
    """Grand Exchange offer type."""
    BUY = "buy"
    SELL = "sell"


class OfferStatus(Enum):
    """Grand Exchange offer status."""
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Player(Base):
    """Player model for economy system."""
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="player")
    sent_trades = relationship("Trade", foreign_keys="Trade.initiator_id",
                              back_populates="initiator")
    received_trades = relationship("Trade", foreign_keys="Trade.receiver_id",
                                  back_populates="receiver")
    ge_offers = relationship("GrandExchangeOffer", back_populates="player")


class Item(Base):
    """Item model for tradeable items."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    is_tradeable = Column(Boolean, default=True)
    is_stackable = Column(Boolean, default=False)
    base_value = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="item")
    trade_items = relationship("TradeItem", back_populates="item")
    ge_offers = relationship("GrandExchangeOffer", back_populates="item")
    price_history = relationship("PriceHistory", back_populates="item")


class InventoryItem(Base):
    """Player inventory items."""
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    player = relationship("Player", back_populates="inventory_items")
    item = relationship("Item", back_populates="inventory_items")

    # Indexes
    __table_args__ = (
        Index('idx_player_item', 'player_id', 'item_id'),
    )


class Trade(Base):
    """Direct player-to-player trade."""
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True)
    initiator_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    status = Column(String(20), default=TradeStatus.PENDING.value)
    initiated_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    notes = Column(Text)

    # Relationships
    initiator = relationship("Player", foreign_keys=[initiator_id],
                           back_populates="sent_trades")
    receiver = relationship("Player", foreign_keys=[receiver_id],
                          back_populates="received_trades")
    trade_items = relationship("TradeItem", back_populates="trade")
    audit_logs = relationship("AuditLog", back_populates="trade")

    # Indexes
    __table_args__ = (
        Index('idx_trade_status', 'status'),
        Index('idx_trade_players', 'initiator_id', 'receiver_id'),
    )


class TradeItem(Base):
    """Items being traded in a direct trade."""
    __tablename__ = "trade_items"

    id = Column(Integer, primary_key=True)
    trade_id = Column(Integer, ForeignKey("trades.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    from_player_id = Column(Integer, ForeignKey("players.id"),
                           nullable=False)
    to_player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    # Relationships
    trade = relationship("Trade", back_populates="trade_items")
    item = relationship("Item", back_populates="trade_items")


class GrandExchangeOffer(Base):
    """Grand Exchange buy/sell offers."""
    __tablename__ = "ge_offers"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    offer_type = Column(String(10), nullable=False)  # buy/sell
    quantity = Column(Integer, nullable=False)
    price_per_item = Column(Numeric(10, 2), nullable=False)
    quantity_remaining = Column(Integer)
    status = Column(String(20), default=OfferStatus.ACTIVE.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    expires_at = Column(DateTime)

    # Relationships
    player = relationship("Player", back_populates="ge_offers")
    item = relationship("Item", back_populates="ge_offers")
    transactions = relationship("GrandExchangeTransaction",
                               back_populates="offer")

    # Indexes
    __table_args__ = (
        Index('idx_ge_item_type', 'item_id', 'offer_type'),
        Index('idx_ge_status', 'status'),
        Index('idx_ge_price', 'price_per_item'),
    )


class GrandExchangeTransaction(Base):
    """Completed GE transactions."""
    __tablename__ = "ge_transactions"

    id = Column(Integer, primary_key=True)
    offer_id = Column(Integer, ForeignKey("ge_offers.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_per_item = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    offer = relationship("GrandExchangeOffer", back_populates="transactions")


class PriceHistory(Base):
    """Item price history for market analysis."""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    volume = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String(20), default="ge")  # ge, direct_trade

    # Relationships
    item = relationship("Item", back_populates="price_history")

    # Indexes
    __table_args__ = (
        Index('idx_price_item_date', 'item_id', 'recorded_at'),
    )


class AuditLog(Base):
    """Audit trail for economy operations."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    trade_id = Column(Integer, ForeignKey("trades.id"))
    action = Column(String(50), nullable=False)
    details = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    trade = relationship("Trade", back_populates="audit_logs")

    # Indexes
    __table_args__ = (
        Index('idx_audit_player', 'player_id'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_date', 'created_at'),
    )


class DatabaseManager:
    """Database connection and session management."""

    def __init__(self, database_url: str = "sqlite:///runerogue.db"):
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def create_tables(self):
        """Create all database tables."""
        Base.metadata.create_all(bind=self.engine)

    def get_session(self):
        """Get a new database session."""
        return self.SessionLocal()

    def drop_tables(self):
        """Drop all tables (for testing)."""
        Base.metadata.drop_all(bind=self.engine)


# Global database manager instance
db_manager = DatabaseManager()