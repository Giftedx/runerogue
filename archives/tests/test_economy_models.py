"""
Tests for economy models

Tests the SQLAlchemy models and database functionality.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from models.economy import (
    DatabaseManager,
    Player,
    Item,
    InventoryItem,
    Trade,
    TradeItem,
    GrandExchangeOffer,
    GrandExchangeTransaction,
    PriceHistory,
    AuditLog,
    TradeStatus,
    OfferType,
    OfferStatus,
)


class TestEconomyModels:
    """Test economy data models."""

    @pytest.fixture
    def db_manager(self):
        """Create a test database manager."""
        db = DatabaseManager(database_url="sqlite:///:memory:")
        db.create_tables()
        return db

    @pytest.fixture
    def session(self, db_manager):
        """Create a test database session."""
        session = db_manager.get_session()
        yield session
        session.close()

    def test_player_creation(self, session):
        """Test player model creation."""
        player = Player(
            username="testuser",
            email="test@example.com"
        )
        session.add(player)
        session.commit()

        assert player.id is not None
        assert player.username == "testuser"
        assert player.email == "test@example.com"
        assert player.is_active is True
        assert player.created_at is not None

    def test_item_creation(self, session):
        """Test item model creation."""
        item = Item(
            name="Iron Sword",
            description="A basic iron sword",
            is_tradeable=True,
            is_stackable=False,
            base_value=Decimal("100.00")
        )
        session.add(item)
        session.commit()

        assert item.id is not None
        assert item.name == "Iron Sword"
        assert item.is_tradeable is True
        assert item.base_value == Decimal("100.00")

    def test_inventory_item_creation(self, session):
        """Test inventory item model creation."""
        player = Player(username="testuser", email="test@example.com")
        item = Item(name="Iron Sword", is_tradeable=True)
        session.add_all([player, item])
        session.flush()

        inventory_item = InventoryItem(
            player_id=player.id,
            item_id=item.id,
            quantity=5
        )
        session.add(inventory_item)
        session.commit()

        assert inventory_item.id is not None
        assert inventory_item.quantity == 5
        assert inventory_item.player == player
        assert inventory_item.item == item

    def test_trade_creation(self, session):
        """Test trade model creation."""
        player1 = Player(username="player1", email="p1@example.com")
        player2 = Player(username="player2", email="p2@example.com")
        session.add_all([player1, player2])
        session.flush()

        trade = Trade(
            initiator_id=player1.id,
            receiver_id=player2.id,
            notes="Test trade"
        )
        session.add(trade)
        session.commit()

        assert trade.id is not None
        assert trade.status == TradeStatus.PENDING.value
        assert trade.initiator == player1
        assert trade.receiver == player2

    def test_grand_exchange_offer_creation(self, session):
        """Test Grand Exchange offer model creation."""
        player = Player(username="trader", email="trader@example.com")
        item = Item(name="Iron Ore", is_tradeable=True)
        session.add_all([player, item])
        session.flush()

        offer = GrandExchangeOffer(
            player_id=player.id,
            item_id=item.id,
            offer_type=OfferType.BUY.value,
            quantity=100,
            price_per_item=Decimal("50.00"),
            quantity_remaining=100
        )
        session.add(offer)
        session.commit()

        assert offer.id is not None
        assert offer.offer_type == OfferType.BUY.value
        assert offer.status == OfferStatus.ACTIVE.value
        assert offer.price_per_item == Decimal("50.00")

    def test_price_history_creation(self, session):
        """Test price history model creation."""
        item = Item(name="Coal", is_tradeable=True)
        session.add(item)
        session.flush()

        price_entry = PriceHistory(
            item_id=item.id,
            price=Decimal("25.50"),
            volume=150
        )
        session.add(price_entry)
        session.commit()

        assert price_entry.id is not None
        assert price_entry.price == Decimal("25.50")
        assert price_entry.volume == 150

    def test_audit_log_creation(self, session):
        """Test audit log model creation."""
        player = Player(username="testuser", email="test@example.com")
        session.add(player)
        session.flush()

        audit_log = AuditLog(
            player_id=player.id,
            action="test_action",
            details="Test audit entry"
        )
        session.add(audit_log)
        session.commit()

        assert audit_log.id is not None
        assert audit_log.action == "test_action"
        assert audit_log.details == "Test audit entry"

    def test_trade_with_items(self, session):
        """Test a complete trade with items."""
        # Create players and items
        player1 = Player(username="player1", email="p1@example.com")
        player2 = Player(username="player2", email="p2@example.com")
        item = Item(name="Steel Sword", is_tradeable=True)
        session.add_all([player1, player2, item])
        session.flush()

        # Create trade
        trade = Trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )
        session.add(trade)
        session.flush()

        # Add item to trade
        trade_item = TradeItem(
            trade_id=trade.id,
            item_id=item.id,
            quantity=1,
            from_player_id=player1.id,
            to_player_id=player2.id
        )
        session.add(trade_item)
        session.commit()

        assert len(trade.trade_items) == 1
        assert trade.trade_items[0].quantity == 1
        assert trade.trade_items[0].item == item

    def test_ge_transaction_creation(self, session):
        """Test Grand Exchange transaction creation."""
        buyer = Player(username="buyer", email="buyer@example.com")
        seller = Player(username="seller", email="seller@example.com")
        item = Item(name="Gold Ore", is_tradeable=True)
        session.add_all([buyer, seller, item])
        session.flush()

        # Create offer first
        offer = GrandExchangeOffer(
            player_id=buyer.id,
            item_id=item.id,
            offer_type=OfferType.BUY.value,
            quantity=50,
            price_per_item=Decimal("75.00"),
            quantity_remaining=50
        )
        session.add(offer)
        session.flush()

        # Create transaction
        transaction = GrandExchangeTransaction(
            offer_id=offer.id,
            buyer_id=buyer.id,
            seller_id=seller.id,
            item_id=item.id,
            quantity=25,
            price_per_item=Decimal("75.00"),
            total_price=Decimal("1875.00")
        )
        session.add(transaction)
        session.commit()

        assert transaction.id is not None
        assert transaction.quantity == 25
        assert transaction.total_price == Decimal("1875.00")
        assert transaction.offer == offer