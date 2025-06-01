"""
Tests for economy API endpoints

Tests the Flask API endpoints for trading and Grand Exchange.
"""

import pytest
import json
from decimal import Decimal

from app import app
from models.economy import DatabaseManager, Player, Item, InventoryItem


class TestEconomyAPI:
    """Test economy API endpoints."""

    @pytest.fixture
    def client(self, db_manager):
        """Create a test client."""
        app.config['TESTING'] = True
        # Patch the database manager for testing
        with app.test_client() as client:
            # Override the global db_manager for tests
            import models.economy
            import economy.trading
            import economy.grand_exchange
            
            original_db = models.economy.db_manager
            models.economy.db_manager = db_manager
            economy.trading.trading_system.db = db_manager  
            economy.grand_exchange.grand_exchange.db = db_manager
            
            yield client
            
            # Restore original db_manager
            models.economy.db_manager = original_db

    @pytest.fixture
    def db_manager(self):
        """Create a test database manager."""
        db = DatabaseManager(database_url="sqlite:///:memory:")
        db.create_tables()
        return db

    @pytest.fixture
    def test_data(self, db_manager):
        """Create test data."""
        session = db_manager.get_session()
        try:
            # Create players
            player1 = Player(username="alice", email="alice@example.com")
            player2 = Player(username="bob", email="bob@example.com")
            
            # Create item
            item = Item(
                name="Iron Sword",
                description="A basic iron sword",
                is_tradeable=True,
                base_value=Decimal("100.00")
            )
            
            session.add_all([player1, player2, item])
            session.commit()
            
            # Give player1 some items
            inventory_item = InventoryItem(
                player_id=player1.id,
                item_id=item.id,
                quantity=10
            )
            session.add(inventory_item)
            session.commit()
            
            return {
                'player1_id': player1.id,
                'player2_id': player2.id,
                'item_id': item.id
            }
        finally:
            session.close()

    def test_initiate_trade_success(self, client, test_data):
        """Test successful trade initiation via API."""
        response = client.post('/trading/initiate', 
                              json={
                                  'initiator_id': test_data['player1_id'],
                                  'receiver_id': test_data['player2_id'],
                                  'notes': 'Test trade'
                              })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'trade_id' in data
        assert data['status'] == 'pending'

    def test_initiate_trade_missing_fields(self, client):
        """Test trade initiation with missing fields."""
        response = client.post('/trading/initiate', 
                              json={'initiator_id': 1})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Missing required fields' in data['error']

    def test_add_item_to_trade_success(self, client, test_data):
        """Test adding item to trade via API."""
        # First initiate trade
        trade_response = client.post('/trading/initiate', 
                                   json={
                                       'initiator_id': test_data['player1_id'],
                                       'receiver_id': test_data['player2_id']
                                   })
        trade_data = json.loads(trade_response.data)
        trade_id = trade_data['trade_id']
        
        # Add item to trade
        response = client.post(f'/trading/{trade_id}/add_item',
                              json={
                                  'player_id': test_data['player1_id'],
                                  'item_id': test_data['item_id'],
                                  'quantity': 2
                              })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['items']) == 1
        assert data['items'][0]['quantity'] == 2

    def test_accept_trade_success(self, client, test_data):
        """Test accepting trade via API."""
        # Initiate trade and add item
        trade_response = client.post('/trading/initiate', 
                                   json={
                                       'initiator_id': test_data['player1_id'],
                                       'receiver_id': test_data['player2_id']
                                   })
        trade_data = json.loads(trade_response.data)
        trade_id = trade_data['trade_id']
        
        client.post(f'/trading/{trade_id}/add_item',
                   json={
                       'player_id': test_data['player1_id'],
                       'item_id': test_data['item_id'],
                       'quantity': 1
                   })
        
        # Accept trade
        response = client.post(f'/trading/{trade_id}/accept',
                              json={'player_id': test_data['player2_id']})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'completed'

    def test_decline_trade(self, client, test_data):
        """Test declining trade via API."""
        # Initiate trade
        trade_response = client.post('/trading/initiate', 
                                   json={
                                       'initiator_id': test_data['player1_id'],
                                       'receiver_id': test_data['player2_id']
                                   })
        trade_data = json.loads(trade_response.data)
        trade_id = trade_data['trade_id']
        
        # Decline trade
        response = client.post(f'/trading/{trade_id}/decline',
                              json={'player_id': test_data['player2_id']})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'declined'

    def test_get_trade_details(self, client, test_data):
        """Test getting trade details via API."""
        # Initiate trade
        trade_response = client.post('/trading/initiate', 
                                   json={
                                       'initiator_id': test_data['player1_id'],
                                       'receiver_id': test_data['player2_id']
                                   })
        trade_data = json.loads(trade_response.data)
        trade_id = trade_data['trade_id']
        
        # Get trade details
        response = client.get(f'/trading/{trade_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['trade_id'] == trade_id
        assert data['status'] == 'pending'

    def test_get_player_trades(self, client, test_data):
        """Test getting player trades via API."""
        # Initiate a trade
        client.post('/trading/initiate', 
                   json={
                       'initiator_id': test_data['player1_id'],
                       'receiver_id': test_data['player2_id']
                   })
        
        # Get player trades
        response = client.get(f'/trading/player/{test_data["player1_id"]}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'trades' in data
        assert len(data['trades']) >= 1

    def test_place_buy_offer(self, client, test_data):
        """Test placing buy offer via API."""
        response = client.post('/ge/buy',
                              json={
                                  'player_id': test_data['player1_id'],
                                  'item_id': test_data['item_id'],
                                  'quantity': 5,
                                  'price_per_item': '150.00'
                              })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'offer_id' in data
        assert data['offer_type'] == 'buy'
        assert data['quantity'] == 5

    def test_place_sell_offer(self, client, test_data):
        """Test placing sell offer via API."""
        response = client.post('/ge/sell',
                              json={
                                  'player_id': test_data['player1_id'],
                                  'item_id': test_data['item_id'],
                                  'quantity': 3,
                                  'price_per_item': '120.00'
                              })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'offer_id' in data
        assert data['offer_type'] == 'sell'
        assert data['quantity'] == 3

    def test_cancel_ge_offer(self, client, test_data):
        """Test cancelling GE offer via API."""
        # Place offer first
        offer_response = client.post('/ge/buy',
                                   json={
                                       'player_id': test_data['player1_id'],
                                       'item_id': test_data['item_id'],
                                       'quantity': 5,
                                       'price_per_item': '150.00'
                                   })
        offer_data = json.loads(offer_response.data)
        offer_id = offer_data['offer_id']
        
        # Cancel offer
        response = client.post(f'/ge/offers/{offer_id}/cancel',
                              json={'player_id': test_data['player1_id']})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'cancelled'

    def test_get_player_offers(self, client, test_data):
        """Test getting player offers via API."""
        # Place an offer
        client.post('/ge/buy',
                   json={
                       'player_id': test_data['player1_id'],
                       'item_id': test_data['item_id'],
                       'quantity': 5,
                       'price_per_item': '150.00'
                   })
        
        # Get player offers
        response = client.get(f'/ge/player/{test_data["player1_id"]}/offers')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'offers' in data
        assert len(data['offers']) >= 1

    def test_get_item_market_data(self, client, test_data):
        """Test getting item market data via API."""
        response = client.get(f'/ge/items/{test_data["item_id"]}/market')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['item_name'] == 'Iron Sword'
        assert 'buy_offers' in data
        assert 'sell_offers' in data

    def test_get_item_price_history(self, client, test_data):
        """Test getting item price history via API."""
        response = client.get(f'/ge/items/{test_data["item_id"]}/history')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'price_history' in data

    def test_initialize_database(self, client):
        """Test database initialization endpoint."""
        response = client.post('/admin/init_db')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data

    def test_invalid_price_format(self, client, test_data):
        """Test invalid price format in GE offers."""
        response = client.post('/ge/buy',
                              json={
                                  'player_id': test_data['player1_id'],
                                  'item_id': test_data['item_id'],
                                  'quantity': 5,
                                  'price_per_item': 'invalid_price'
                              })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'Invalid price format' in data['error']

    def test_nonexistent_trade_operations(self, client, test_data):
        """Test operations on non-existent trades."""
        # Try to get details of non-existent trade
        response = client.get('/trading/99999')
        assert response.status_code == 404

        # Try to accept non-existent trade
        response = client.post('/trading/99999/accept',
                              json={'player_id': test_data['player1_id']})
        assert response.status_code == 400

    def test_nonexistent_item_market_data(self, client):
        """Test getting market data for non-existent item."""
        response = client.get('/ge/items/99999/market')
        assert response.status_code == 404