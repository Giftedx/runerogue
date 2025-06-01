"""
Tests for Grand Exchange system

Tests the automated marketplace functionality.
"""

import pytest
from unittest.mock import patch
from decimal import Decimal
from datetime import datetime, timedelta

from economy.grand_exchange import (
    GrandExchangeSystem,
    GrandExchangeError,
    InvalidOfferError,
    InsufficientFundsError
)
from models.economy import (
    DatabaseManager,
    Player,
    Item,
    InventoryItem,
    GrandExchangeOffer,
    GrandExchangeTransaction,
    PriceHistory,
    OfferType,
    OfferStatus
)


class TestGrandExchangeSystem:
    """Test Grand Exchange system functionality."""

    @pytest.fixture
    def db_manager(self):
        """Create a test database manager."""
        db = DatabaseManager(database_url="sqlite:///:memory:")
        db.create_tables()
        return db

    @pytest.fixture
    def ge_system(self, db_manager):
        """Create a Grand Exchange system with test database."""
        system = GrandExchangeSystem()
        system.db = db_manager
        return system

    @pytest.fixture
    def session(self, db_manager):
        """Create a test database session."""
        session = db_manager.get_session()
        yield session
        session.close()

    @pytest.fixture
    def test_players(self, session):
        """Create test players."""
        buyer = Player(username="buyer", email="buyer@example.com")
        seller = Player(username="seller", email="seller@example.com")
        session.add_all([buyer, seller])
        session.commit()
        return buyer, seller

    @pytest.fixture
    def test_item(self, session):
        """Create a test item."""
        item = Item(
            name="Gold Ore",
            description="Precious gold ore",
            is_tradeable=True,
            base_value=Decimal("50.00")
        )
        session.add(item)
        session.commit()
        return item

    def test_place_buy_offer_success(self, ge_system, test_players, test_item):
        """Test successfully placing a buy offer."""
        buyer, _ = test_players

        result = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=100,
            price_per_item=Decimal("75.00")
        )

        assert "offer_id" in result
        assert result["status"] == OfferStatus.ACTIVE.value
        assert result["offer_type"] == OfferType.BUY.value
        assert result["quantity"] == 100
        assert result["price_per_item"] == 75.00

    def test_place_sell_offer_success(self, ge_system, test_players,
                                     test_item, session):
        """Test successfully placing a sell offer."""
        _, seller = test_players

        # Give seller some items to sell
        inventory_item = InventoryItem(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=50
        )
        session.add(inventory_item)
        session.commit()

        result = ge_system.place_sell_offer(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("80.00")
        )

        assert "offer_id" in result
        assert result["status"] == OfferStatus.ACTIVE.value
        assert result["offer_type"] == OfferType.SELL.value
        assert result["quantity"] == 25
        assert result["price_per_item"] == 80.00

    def test_place_sell_offer_insufficient_items(self, ge_system,
                                                 test_players, test_item):
        """Test placing sell offer without sufficient items."""
        _, seller = test_players

        with pytest.raises(InvalidOfferError, match="Insufficient"):
            ge_system.place_sell_offer(
                player_id=seller.id,
                item_id=test_item.id,
                quantity=100,  # Seller has no items
                price_per_item=Decimal("80.00")
            )

    def test_offer_validation(self, ge_system, test_players, test_item):
        """Test offer validation."""
        buyer, _ = test_players

        # Test negative quantity
        with pytest.raises(InvalidOfferError, match="Quantity must be positive"):
            ge_system.place_buy_offer(
                player_id=buyer.id,
                item_id=test_item.id,
                quantity=-5,
                price_per_item=Decimal("75.00")
            )

        # Test negative price
        with pytest.raises(InvalidOfferError, match="Price must be positive"):
            ge_system.place_buy_offer(
                player_id=buyer.id,
                item_id=test_item.id,
                quantity=10,
                price_per_item=Decimal("-10.00")
            )

        # Test non-existent item
        with pytest.raises(InvalidOfferError, match="Item not found"):
            ge_system.place_buy_offer(
                player_id=buyer.id,
                item_id=99999,  # Non-existent item
                quantity=10,
                price_per_item=Decimal("75.00")
            )

    def test_offer_matching(self, ge_system, test_players, test_item, session):
        """Test automatic offer matching."""
        buyer, seller = test_players

        # Give seller items
        inventory_item = InventoryItem(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=100
        )
        session.add(inventory_item)
        session.commit()

        # Place sell offer first
        sell_result = ge_system.place_sell_offer(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=50,
            price_per_item=Decimal("70.00")
        )

        # Place matching buy offer (higher price should match)
        buy_result = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=30,
            price_per_item=Decimal("75.00")  # Higher than sell price
        )

        # Check that offers were matched
        session.refresh(inventory_item)
        assert inventory_item.quantity == 70  # 100 - 30 = 70

        # Check buyer received items
        buyer_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == buyer.id,
            InventoryItem.item_id == test_item.id
        ).first()
        assert buyer_inventory is not None
        assert buyer_inventory.quantity == 30

        # Check that transaction was recorded
        transaction = session.query(GrandExchangeTransaction).filter(
            GrandExchangeTransaction.buyer_id == buyer.id,
            GrandExchangeTransaction.seller_id == seller.id
        ).first()
        assert transaction is not None
        assert transaction.quantity == 30
        assert transaction.price_per_item == Decimal("70.00")  # Seller's price

    def test_partial_matching(self, ge_system, test_players, test_item, session):
        """Test partial offer matching."""
        buyer, seller = test_players

        # Give seller items
        inventory_item = InventoryItem(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=100
        )
        session.add(inventory_item)
        session.commit()

        # Place large buy offer
        buy_result = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=100,
            price_per_item=Decimal("75.00")
        )

        # Place smaller sell offer that partially matches
        sell_result = ge_system.place_sell_offer(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=30,
            price_per_item=Decimal("70.00")
        )

        # Check buy offer still has remaining quantity
        buy_offer = session.query(GrandExchangeOffer).filter(
            GrandExchangeOffer.id == buy_result["offer_id"]
        ).first()
        assert buy_offer.quantity_remaining == 70  # 100 - 30

        # Check sell offer is completed
        sell_offer = session.query(GrandExchangeOffer).filter(
            GrandExchangeOffer.id == sell_result["offer_id"]
        ).first()
        assert sell_offer.status == OfferStatus.COMPLETED.value

    def test_cancel_offer(self, ge_system, test_players, test_item):
        """Test cancelling an offer."""
        buyer, _ = test_players

        # Place offer
        result = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=50,
            price_per_item=Decimal("75.00")
        )

        # Cancel offer
        cancel_result = ge_system.cancel_offer(
            offer_id=result["offer_id"],
            player_id=buyer.id
        )

        assert cancel_result["status"] == "cancelled"

    def test_get_player_offers(self, ge_system, test_players, test_item):
        """Test getting player's offers."""
        buyer, _ = test_players

        # Place multiple offers
        offer1 = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=50,
            price_per_item=Decimal("75.00")
        )

        offer2 = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("80.00")
        )

        # Get all offers
        offers = ge_system.get_player_offers(buyer.id)
        assert len(offers) == 2

        # Get only active offers
        active_offers = ge_system.get_player_offers(
            buyer.id,
            status=OfferStatus.ACTIVE.value
        )
        assert len(active_offers) == 2

    def test_get_item_market_data(self, ge_system, test_players,
                                 test_item, session):
        """Test getting market data for an item."""
        buyer, seller = test_players

        # Give seller items
        inventory_item = InventoryItem(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=100
        )
        session.add(inventory_item)
        session.commit()

        # Place some offers
        buy_offer = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=50,
            price_per_item=Decimal("70.00")
        )

        sell_offer = ge_system.place_sell_offer(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("80.00")
        )

        # Get market data
        market_data = ge_system.get_item_market_data(test_item.id)

        assert market_data["item_name"] == "Gold Ore"
        assert market_data["highest_buy_offer"] == 70.00
        assert market_data["lowest_sell_offer"] == 80.00
        assert len(market_data["buy_offers"]) == 1
        assert len(market_data["sell_offers"]) == 1

    def test_price_history_recording(self, ge_system, test_players,
                                    test_item, session):
        """Test that price history is recorded during transactions."""
        buyer, seller = test_players

        # Give seller items
        inventory_item = InventoryItem(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=100
        )
        session.add(inventory_item)
        session.commit()

        # Create a transaction through matching
        ge_system.place_sell_offer(
            player_id=seller.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("75.00")
        )

        ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("80.00")  # Will match at 75.00
        )

        # Check price history was recorded
        price_history = session.query(PriceHistory).filter(
            PriceHistory.item_id == test_item.id
        ).first()

        assert price_history is not None
        assert price_history.price == Decimal("75.00")
        assert price_history.volume == 25

    def test_get_price_history(self, ge_system, test_item, session):
        """Test getting price history for an item."""
        # Add some price history manually
        for i in range(5):
            price_entry = PriceHistory(
                item_id=test_item.id,
                price=Decimal(f"{50 + i}.00"),
                volume=10 * (i + 1),
                recorded_at=datetime.utcnow() - timedelta(days=i)
            )
            session.add(price_entry)
        session.commit()

        # Get price history
        history = ge_system.get_price_history(test_item.id, days=10)

        assert len(history) == 5
        assert history[0]["price"] == 54.00  # Most recent (oldest entry)
        assert history[-1]["price"] == 50.00  # Oldest (newest entry)

    def test_expire_old_offers(self, ge_system, test_players, test_item, session):
        """Test expiring old offers."""
        buyer, _ = test_players

        # Create an offer and manually set it to be expired
        offer = GrandExchangeOffer(
            player_id=buyer.id,
            item_id=test_item.id,
            offer_type=OfferType.BUY.value,
            quantity=50,
            price_per_item=Decimal("75.00"),
            quantity_remaining=50,
            expires_at=datetime.utcnow() - timedelta(hours=1)  # Already expired
        )
        session.add(offer)
        session.commit()

        # Run expiration
        expired_count = ge_system.expire_old_offers()

        assert expired_count == 1

        # Check offer is marked as expired
        session.refresh(offer)
        assert offer.status == OfferStatus.EXPIRED.value

    @patch('economy.grand_exchange.logger')
    def test_logging_functionality(self, mock_logger, ge_system,
                                  test_players, test_item):
        """Test that actions are properly logged."""
        buyer, _ = test_players

        # Place offer
        ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=50,
            price_per_item=Decimal("75.00")
        )

        # Verify logging was called
        mock_logger.info.assert_called()
        log_calls = [call[0][0] for call in mock_logger.info.call_args_list]
        assert any("placed buy offer" in call for call in log_calls)

    def test_no_self_trading(self, ge_system, test_players, test_item, session):
        """Test that players cannot trade with themselves."""
        buyer, _ = test_players

        # Give buyer items to sell
        inventory_item = InventoryItem(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=100
        )
        session.add(inventory_item)
        session.commit()

        # Place sell offer
        sell_result = ge_system.place_sell_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("70.00")
        )

        # Place buy offer from same player (should not match)
        buy_result = ge_system.place_buy_offer(
            player_id=buyer.id,
            item_id=test_item.id,
            quantity=25,
            price_per_item=Decimal("80.00")
        )

        # Check no transaction occurred
        transaction = session.query(GrandExchangeTransaction).filter(
            GrandExchangeTransaction.buyer_id == buyer.id,
            GrandExchangeTransaction.seller_id == buyer.id
        ).first()
        assert transaction is None

        # Both offers should still be active
        sell_offer = session.query(GrandExchangeOffer).filter(
            GrandExchangeOffer.id == sell_result["offer_id"]
        ).first()
        buy_offer = session.query(GrandExchangeOffer).filter(
            GrandExchangeOffer.id == buy_result["offer_id"]
        ).first()

        assert sell_offer.status == OfferStatus.ACTIVE.value
        assert buy_offer.status == OfferStatus.ACTIVE.value