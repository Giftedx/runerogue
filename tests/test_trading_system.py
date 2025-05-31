"""
Tests for trading system

Tests the direct player-to-player trading functionality.
"""

import pytest
from unittest.mock import patch
from decimal import Decimal

from economy.trading import (
    TradingSystem,
    TradingError,
    InvalidTradeError,
    InsufficientItemsError
)
from models.economy import (
    DatabaseManager,
    Player,
    Item,
    InventoryItem,
    Trade,
    TradeItem,
    TradeStatus
)


class TestTradingSystem:
    """Test trading system functionality."""

    @pytest.fixture
    def db_manager(self):
        """Create a test database manager."""
        db = DatabaseManager(database_url="sqlite:///:memory:")
        db.create_tables()
        return db

    @pytest.fixture
    def trading_system(self, db_manager):
        """Create a trading system with test database."""
        system = TradingSystem()
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
        player1 = Player(username="alice", email="alice@example.com")
        player2 = Player(username="bob", email="bob@example.com")
        session.add_all([player1, player2])
        session.commit()
        return player1, player2

    @pytest.fixture
    def test_item(self, session):
        """Create a test item."""
        item = Item(
            name="Iron Sword",
            description="A basic iron sword",
            is_tradeable=True,
            base_value=Decimal("100.00")
        )
        session.add(item)
        session.commit()
        return item

    def test_initiate_trade_success(self, trading_system, test_players):
        """Test successful trade initiation."""
        player1, player2 = test_players

        result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id,
            notes="Test trade"
        )

        assert "trade_id" in result
        assert result["status"] == TradeStatus.PENDING.value
        assert result["initiator"]["username"] == "alice"
        assert result["receiver"]["username"] == "bob"

    def test_initiate_trade_self_trade(self, trading_system, test_players):
        """Test that self-trading is not allowed."""
        player1, _ = test_players

        with pytest.raises(InvalidTradeError, match="Cannot trade with yourself"):
            trading_system.initiate_trade(
                initiator_id=player1.id,
                receiver_id=player1.id
            )

    def test_initiate_trade_invalid_player(self, trading_system, test_players):
        """Test trade initiation with invalid player."""
        player1, _ = test_players

        with pytest.raises(InvalidTradeError, match="Receiver not found"):
            trading_system.initiate_trade(
                initiator_id=player1.id,
                receiver_id=99999  # Non-existent player
            )

    def test_add_item_to_trade_success(self, trading_system, test_players,
                                      test_item, session):
        """Test successfully adding an item to a trade."""
        player1, player2 = test_players

        # Give player1 some items
        inventory_item = InventoryItem(
            player_id=player1.id,
            item_id=test_item.id,
            quantity=5
        )
        session.add(inventory_item)
        session.commit()

        # Initiate trade
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        # Add item to trade
        result = trading_system.add_item_to_trade(
            trade_id=trade_result["trade_id"],
            player_id=player1.id,
            item_id=test_item.id,
            quantity=2
        )

        assert len(result["items"]) == 1
        assert result["items"][0]["quantity"] == 2
        assert result["items"][0]["item_name"] == "Iron Sword"

    def test_add_item_insufficient_quantity(self, trading_system,
                                           test_players, test_item, session):
        """Test adding more items than player has."""
        player1, player2 = test_players

        # Give player1 only 1 item
        inventory_item = InventoryItem(
            player_id=player1.id,
            item_id=test_item.id,
            quantity=1
        )
        session.add(inventory_item)
        session.commit()

        # Initiate trade
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        # Try to add more items than available
        with pytest.raises(InsufficientItemsError):
            trading_system.add_item_to_trade(
                trade_id=trade_result["trade_id"],
                player_id=player1.id,
                item_id=test_item.id,
                quantity=5  # More than the 1 available
            )

    def test_accept_trade_success(self, trading_system, test_players,
                                 test_item, session):
        """Test successfully accepting a trade."""
        player1, player2 = test_players

        # Setup inventories
        inventory_item1 = InventoryItem(
            player_id=player1.id,
            item_id=test_item.id,
            quantity=5
        )
        session.add(inventory_item1)
        session.commit()

        # Initiate trade and add item
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        trading_system.add_item_to_trade(
            trade_id=trade_result["trade_id"],
            player_id=player1.id,
            item_id=test_item.id,
            quantity=2
        )

        # Accept trade
        result = trading_system.accept_trade(
            trade_id=trade_result["trade_id"],
            player_id=player2.id
        )

        assert result["status"] == "completed"

        # Check inventory changes
        session.refresh(inventory_item1)
        assert inventory_item1.quantity == 3  # 5 - 2 = 3

        # Check player2 received the items
        player2_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == player2.id,
            InventoryItem.item_id == test_item.id
        ).first()
        assert player2_inventory is not None
        assert player2_inventory.quantity == 2

    def test_decline_trade(self, trading_system, test_players):
        """Test declining a trade."""
        player1, player2 = test_players

        # Initiate trade
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        # Decline trade
        result = trading_system.decline_trade(
            trade_id=trade_result["trade_id"],
            player_id=player2.id
        )

        assert result["status"] == "declined"

        # Verify trade details
        trade_details = trading_system.get_trade_details(
            trade_result["trade_id"]
        )
        assert trade_details["status"] == TradeStatus.DECLINED.value

    def test_get_player_trades(self, trading_system, test_players, session):
        """Test getting all trades for a player."""
        player1, player2 = test_players

        # Create first trade
        trade1 = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id,
            notes="Trade 1"
        )

        # Complete the first trade so we can create a second one
        trading_system.decline_trade(
            trade_id=trade1["trade_id"],
            player_id=player2.id
        )

        # Now create a second trade
        trade2 = trading_system.initiate_trade(
            initiator_id=player2.id,
            receiver_id=player1.id,
            notes="Trade 2"
        )

        # Get player1's trades
        trades = trading_system.get_player_trades(player1.id)

        assert len(trades) == 2
        assert any(t["trade_id"] == trade1["trade_id"] for t in trades)
        assert any(t["trade_id"] == trade2["trade_id"] for t in trades)

    def test_get_player_trades_filtered(self, trading_system, test_players):
        """Test getting trades filtered by status."""
        player1, player2 = test_players

        # Create and decline a trade
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        trading_system.decline_trade(
            trade_id=trade_result["trade_id"],
            player_id=player2.id
        )

        # Get only declined trades
        declined_trades = trading_system.get_player_trades(
            player1.id,
            status=TradeStatus.DECLINED.value
        )

        assert len(declined_trades) == 1
        assert declined_trades[0]["trade_id"] == trade_result["trade_id"]

        # Get only pending trades (should be empty)
        pending_trades = trading_system.get_player_trades(
            player1.id,
            status=TradeStatus.PENDING.value
        )

        assert len(pending_trades) == 0

    def test_invalid_trade_operations(self, trading_system, test_players):
        """Test various invalid trade operations."""
        player1, player2 = test_players

        # Try to accept non-existent trade
        with pytest.raises(InvalidTradeError, match="Trade not found"):
            trading_system.accept_trade(
                trade_id=99999,
                player_id=player1.id
            )

        # Try to add item to non-existent trade
        with pytest.raises(InvalidTradeError, match="Trade not found"):
            trading_system.add_item_to_trade(
                trade_id=99999,
                player_id=player1.id,
                item_id=1,
                quantity=1
            )

        # Initiate trade then try invalid operations
        trade_result = trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        # Try to accept as initiator (should be receiver only)
        with pytest.raises(InvalidTradeError,
                          match="Only the receiver can accept"):
            trading_system.accept_trade(
                trade_id=trade_result["trade_id"],
                player_id=player1.id  # Initiator trying to accept
            )

    @patch('economy.trading.logger')
    def test_logging_functionality(self, mock_logger, trading_system,
                                  test_players):
        """Test that actions are properly logged."""
        player1, player2 = test_players

        # Initiate trade
        trading_system.initiate_trade(
            initiator_id=player1.id,
            receiver_id=player2.id
        )

        # Verify logging was called
        mock_logger.info.assert_called()
        log_calls = [call[0][0] for call in mock_logger.info.call_args_list]
        assert any("Trade" in call and "initiated" in call
                  for call in log_calls)