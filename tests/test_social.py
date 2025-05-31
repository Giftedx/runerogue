"""
Test social system functionality.
"""

import json
import pytest
from unittest.mock import patch

from app import app
from models import db, User, Friendship, Party, PartyMember, ChatMessage
from models import UserStatus, FriendshipStatus, ChatMessageType


@pytest.fixture
def client():
    """Create test client with test database."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


@pytest.fixture
def sample_users(client):
    """Create sample users for testing."""
    with app.app_context():
        user1 = User(username='player1', email='player1@test.com')
        user2 = User(username='player2', email='player2@test.com')
        user3 = User(username='player3', email='player3@test.com')
        
        db.session.add_all([user1, user2, user3])
        db.session.commit()
        
        return [user1.id, user2.id, user3.id]


class TestUserManagement:
    """Test user management endpoints."""
    
    def test_create_user(self, client):
        """Test user creation."""
        response = client.post(
            '/api/social/users',
            data=json.dumps({
                'username': 'testuser',
                'email': 'test@example.com'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['username'] == 'testuser'
        assert data['status'] == 'online'
    
    def test_create_user_missing_data(self, client):
        """Test user creation with missing data."""
        response = client.post(
            '/api/social/users',
            data=json.dumps({'username': 'testuser'}),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_create_duplicate_user(self, client, sample_users):
        """Test creating duplicate user."""
        response = client.post(
            '/api/social/users',
            data=json.dumps({
                'username': 'player1',
                'email': 'new@example.com'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 409
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_update_user_status(self, client, sample_users):
        """Test updating user status."""
        user_id = sample_users[0]
        response = client.put(
            f'/api/social/users/{user_id}/status',
            data=json.dumps({'status': 'away'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'away'
    
    def test_update_user_status_invalid(self, client, sample_users):
        """Test updating user status with invalid status."""
        user_id = sample_users[0]
        response = client.put(
            f'/api/social/users/{user_id}/status',
            data=json.dumps({'status': 'invalid'}),
            content_type='application/json'
        )
        
        assert response.status_code == 400


class TestFriendsSystem:
    """Test friends management."""
    
    def test_send_friend_request(self, client, sample_users):
        """Test sending friend request."""
        user_id = sample_users[0]
        target_id = sample_users[1]
        
        response = client.post(
            f'/api/social/users/{user_id}/friend-requests',
            data=json.dumps({'target_user_id': target_id}),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['status'] == 'pending'
        assert data['requester']['id'] == user_id
        assert data['addressee']['id'] == target_id
    
    def test_send_friend_request_to_self(self, client, sample_users):
        """Test sending friend request to self."""
        user_id = sample_users[0]
        
        response = client.post(
            f'/api/social/users/{user_id}/friend-requests',
            data=json.dumps({'target_user_id': user_id}),
            content_type='application/json'
        )
        
        assert response.status_code == 400
    
    def test_accept_friend_request(self, client, sample_users):
        """Test accepting friend request."""
        user_id = sample_users[0]
        target_id = sample_users[1]
        
        # Send request first
        response = client.post(
            f'/api/social/users/{user_id}/friend-requests',
            data=json.dumps({'target_user_id': target_id}),
            content_type='application/json'
        )
        
        request_id = json.loads(response.data)['id']
        
        # Accept request
        response = client.put(
            f'/api/social/friend-requests/{request_id}/respond',
            data=json.dumps({'action': 'accept'}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'accepted'
    
    def test_get_friends(self, client, sample_users):
        """Test getting friends list."""
        user_id = sample_users[0]
        target_id = sample_users[1]
        
        # Create accepted friendship
        with app.app_context():
            friendship = Friendship(
                requester_id=user_id,
                addressee_id=target_id,
                status=FriendshipStatus.ACCEPTED
            )
            db.session.add(friendship)
            db.session.commit()
        
        response = client.get(f'/api/social/users/{user_id}/friends')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['friends']) == 1
        assert data['friends'][0]['id'] == target_id


class TestPartySystem:
    """Test party management."""
    
    def test_create_party(self, client, sample_users):
        """Test party creation."""
        leader_id = sample_users[0]
        
        response = client.post(
            '/api/social/parties',
            data=json.dumps({
                'name': 'Test Party',
                'leader_id': leader_id
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['name'] == 'Test Party'
        assert data['leader']['id'] == leader_id
        assert len(data['members']) == 1  # Leader is auto-added
    
    def test_invite_to_party(self, client, sample_users):
        """Test inviting user to party."""
        leader_id = sample_users[0]
        invitee_id = sample_users[1]
        
        # Create party first
        response = client.post(
            '/api/social/parties',
            data=json.dumps({
                'name': 'Test Party',
                'leader_id': leader_id
            }),
            content_type='application/json'
        )
        
        party_id = json.loads(response.data)['id']
        
        # Invite user
        response = client.post(
            f'/api/social/parties/{party_id}/invite',
            data=json.dumps({'user_id': invitee_id}),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['user']['id'] == invitee_id
    
    def test_leave_party(self, client, sample_users):
        """Test leaving party."""
        leader_id = sample_users[0]
        member_id = sample_users[1]
        
        # Create party and add member
        with app.app_context():
            party = Party(name='Test Party', leader_id=leader_id)
            db.session.add(party)
            db.session.flush()
            
            member1 = PartyMember(party_id=party.id, user_id=leader_id)
            member2 = PartyMember(party_id=party.id, user_id=member_id)
            db.session.add_all([member1, member2])
            db.session.commit()
            
            party_id = party.id
        
        # Leave party
        response = client.post(
            f'/api/social/parties/{party_id}/leave',
            data=json.dumps({'user_id': member_id}),
            content_type='application/json'
        )
        
        assert response.status_code == 200


class TestChatSystem:
    """Test chat system."""
    
    def test_send_public_message(self, client, sample_users):
        """Test sending public message."""
        sender_id = sample_users[0]
        
        response = client.post(
            '/api/social/chat/send',
            data=json.dumps({
                'sender_id': sender_id,
                'message_type': 'public',
                'content': 'Hello everyone!'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['content'] == 'Hello everyone!'
        assert data['message_type'] == 'public'
    
    def test_send_private_message(self, client, sample_users):
        """Test sending private message."""
        sender_id = sample_users[0]
        recipient_id = sample_users[1]
        
        response = client.post(
            '/api/social/chat/send',
            data=json.dumps({
                'sender_id': sender_id,
                'recipient_id': recipient_id,
                'message_type': 'private',
                'content': 'Secret message'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['content'] == 'Secret message'
        assert data['message_type'] == 'private'
        assert data['recipient']['id'] == recipient_id
    
    def test_send_party_message(self, client, sample_users):
        """Test sending party message."""
        sender_id = sample_users[0]
        
        # Create party first
        with app.app_context():
            party = Party(name='Test Party', leader_id=sender_id)
            db.session.add(party)
            db.session.flush()
            
            member = PartyMember(party_id=party.id, user_id=sender_id)
            db.session.add(member)
            db.session.commit()
            
            party_id = party.id
        
        response = client.post(
            '/api/social/chat/send',
            data=json.dumps({
                'sender_id': sender_id,
                'party_id': party_id,
                'message_type': 'party',
                'content': 'Party message'
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['content'] == 'Party message'
        assert data['message_type'] == 'party'
        assert data['party_id'] == party_id
    
    def test_get_messages(self, client, sample_users):
        """Test getting messages."""
        sender_id = sample_users[0]
        
        # Send a message first
        with app.app_context():
            message = ChatMessage(
                sender_id=sender_id,
                message_type=ChatMessageType.PUBLIC,
                content='Test message'
            )
            db.session.add(message)
            db.session.commit()
        
        response = client.get(f'/api/social/chat/messages?user_id={sender_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['messages']) == 1
        assert data['messages'][0]['content'] == 'Test message'
    
    def test_send_message_missing_fields(self, client, sample_users):
        """Test sending message with missing fields."""
        response = client.post(
            '/api/social/chat/send',
            data=json.dumps({
                'sender_id': sample_users[0],
                'content': 'Test'
                # Missing message_type
            }),
            content_type='application/json'
        )
        
        assert response.status_code == 400