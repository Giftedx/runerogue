"""
Social API endpoints for RuneRogue multiplayer features.
"""

import logging
from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy import or_, and_

from models import (
    db, User, Friendship, Party, PartyMember, ChatMessage,
    UserStatus, FriendshipStatus, ChatMessageType
)

logger = logging.getLogger(__name__)

social_bp = Blueprint('social', __name__, url_prefix='/api/social')


# User Management
@social_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user."""
    data = request.get_json()
    
    if not data or 'username' not in data or 'email' not in data:
        return jsonify({'error': 'Username and email required'}), 400
    
    # Check if user exists
    existing_user = User.query.filter(
        or_(User.username == data['username'], User.email == data['email'])
    ).first()
    
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    user = User(
        username=data['username'],
        email=data['email'],
        status=UserStatus.ONLINE
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating user: {e}")
        return jsonify({'error': 'Failed to create user'}), 500


@social_bp.route('/users/<int:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    """Update user status."""
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({'error': 'Status required'}), 400
    
    try:
        status = UserStatus(data['status'])
    except ValueError:
        return jsonify({'error': 'Invalid status'}), 400
    
    user = User.query.get_or_404(user_id)
    user.status = status
    user.last_seen = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user status: {e}")
        return jsonify({'error': 'Failed to update status'}), 500


# Friends Management
@social_bp.route('/users/<int:user_id>/friends', methods=['GET'])
def get_friends(user_id):
    """Get user's friends list."""
    user = User.query.get_or_404(user_id)
    
    # Get accepted friendships where user is either requester or addressee
    friendships = Friendship.query.filter(
        and_(
            or_(
                Friendship.requester_id == user_id,
                Friendship.addressee_id == user_id
            ),
            Friendship.status == FriendshipStatus.ACCEPTED
        )
    ).all()
    
    friends = []
    for friendship in friendships:
        friend = (friendship.addressee if friendship.requester_id == user_id 
                 else friendship.requester)
        friends.append(friend.to_dict())
    
    return jsonify({'friends': friends})


@social_bp.route('/users/<int:user_id>/friend-requests', methods=['POST'])
def send_friend_request(user_id):
    """Send a friend request."""
    data = request.get_json()
    
    if not data or 'target_user_id' not in data:
        return jsonify({'error': 'Target user ID required'}), 400
    
    target_user_id = data['target_user_id']
    
    if user_id == target_user_id:
        return jsonify({'error': 'Cannot send friend request to yourself'}), 400
    
    # Check if users exist
    user = User.query.get_or_404(user_id)
    target_user = User.query.get_or_404(target_user_id)
    
    # Check if friendship already exists
    existing = Friendship.query.filter(
        or_(
            and_(Friendship.requester_id == user_id, 
                 Friendship.addressee_id == target_user_id),
            and_(Friendship.requester_id == target_user_id, 
                 Friendship.addressee_id == user_id)
        )
    ).first()
    
    if existing:
        return jsonify({'error': 'Friendship already exists'}), 409
    
    friendship = Friendship(
        requester_id=user_id,
        addressee_id=target_user_id,
        status=FriendshipStatus.PENDING
    )
    
    try:
        db.session.add(friendship)
        db.session.commit()
        return jsonify(friendship.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error sending friend request: {e}")
        return jsonify({'error': 'Failed to send friend request'}), 500


@social_bp.route('/friend-requests/<int:request_id>/respond', methods=['PUT'])
def respond_to_friend_request(request_id):
    """Accept or reject a friend request."""
    data = request.get_json()
    
    if not data or 'action' not in data:
        return jsonify({'error': 'Action required (accept/reject)'}), 400
    
    action = data['action'].lower()
    if action not in ['accept', 'reject']:
        return jsonify({'error': 'Invalid action'}), 400
    
    friendship = Friendship.query.get_or_404(request_id)
    
    if friendship.status != FriendshipStatus.PENDING:
        return jsonify({'error': 'Request already responded to'}), 400
    
    if action == 'accept':
        friendship.status = FriendshipStatus.ACCEPTED
    else:
        # For rejection, we can delete the record or keep it for audit
        db.session.delete(friendship)
        db.session.commit()
        return jsonify({'message': 'Friend request rejected'})
    
    friendship.updated_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify(friendship.to_dict())
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error responding to friend request: {e}")
        return jsonify({'error': 'Failed to respond to request'}), 500


# Party Management
@social_bp.route('/parties', methods=['POST'])
def create_party():
    """Create a new party."""
    data = request.get_json()
    
    if not data or 'name' not in data or 'leader_id' not in data:
        return jsonify({'error': 'Party name and leader ID required'}), 400
    
    leader = User.query.get_or_404(data['leader_id'])
    
    party = Party(
        name=data['name'],
        leader_id=data['leader_id'],
        max_members=data.get('max_members', 4)
    )
    
    try:
        db.session.add(party)
        db.session.flush()  # Get party ID
        
        # Add leader as first member
        member = PartyMember(party_id=party.id, user_id=data['leader_id'])
        db.session.add(member)
        db.session.commit()
        
        return jsonify(party.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating party: {e}")
        return jsonify({'error': 'Failed to create party'}), 500


@social_bp.route('/parties/<int:party_id>/invite', methods=['POST'])
def invite_to_party(party_id):
    """Invite a user to a party."""
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID required'}), 400
    
    party = Party.query.get_or_404(party_id)
    user = User.query.get_or_404(data['user_id'])
    
    # Check if party is full
    if party.members.count() >= party.max_members:
        return jsonify({'error': 'Party is full'}), 400
    
    # Check if user is already in party
    existing = PartyMember.query.filter(
        and_(PartyMember.party_id == party_id, 
             PartyMember.user_id == data['user_id'])
    ).first()
    
    if existing:
        return jsonify({'error': 'User already in party'}), 409
    
    member = PartyMember(party_id=party_id, user_id=data['user_id'])
    
    try:
        db.session.add(member)
        db.session.commit()
        return jsonify(member.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error inviting to party: {e}")
        return jsonify({'error': 'Failed to invite to party'}), 500


@social_bp.route('/parties/<int:party_id>/leave', methods=['POST'])
def leave_party(party_id):
    """Leave a party."""
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': 'User ID required'}), 400
    
    party = Party.query.get_or_404(party_id)
    
    member = PartyMember.query.filter(
        and_(PartyMember.party_id == party_id, 
             PartyMember.user_id == data['user_id'])
    ).first()
    
    if not member:
        return jsonify({'error': 'User not in party'}), 404
    
    try:
        db.session.delete(member)
        
        # If leader leaves, disband party or transfer leadership
        if party.leader_id == data['user_id']:
            # Simple approach: disband party
            # In a real system, you might transfer leadership
            db.session.delete(party)
        
        db.session.commit()
        return jsonify({'message': 'Left party successfully'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error leaving party: {e}")
        return jsonify({'error': 'Failed to leave party'}), 500


# Chat System
@social_bp.route('/chat/send', methods=['POST'])
def send_message():
    """Send a chat message."""
    data = request.get_json()
    
    required_fields = ['sender_id', 'message_type', 'content']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        message_type = ChatMessageType(data['message_type'])
    except ValueError:
        return jsonify({'error': 'Invalid message type'}), 400
    
    sender = User.query.get_or_404(data['sender_id'])
    
    message = ChatMessage(
        sender_id=data['sender_id'],
        message_type=message_type,
        content=data['content']
    )
    
    # Set recipient or party based on message type
    if message_type in [ChatMessageType.PRIVATE, ChatMessageType.WHISPER]:
        if 'recipient_id' not in data:
            return jsonify({'error': 'Recipient required for private messages'}), 400
        recipient = User.query.get_or_404(data['recipient_id'])
        message.recipient_id = data['recipient_id']
    elif message_type == ChatMessageType.PARTY:
        if 'party_id' not in data:
            return jsonify({'error': 'Party ID required for party messages'}), 400
        party = Party.query.get_or_404(data['party_id'])
        message.party_id = data['party_id']
    
    try:
        db.session.add(message)
        db.session.commit()
        return jsonify(message.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error sending message: {e}")
        return jsonify({'error': 'Failed to send message'}), 500


@social_bp.route('/chat/messages', methods=['GET'])
def get_messages():
    """Get chat messages for a user."""
    user_id = request.args.get('user_id', type=int)
    message_type = request.args.get('type')
    party_id = request.args.get('party_id', type=int)
    limit = request.args.get('limit', 50, type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    query = ChatMessage.query
    
    if message_type:
        try:
            msg_type = ChatMessageType(message_type)
            query = query.filter(ChatMessage.message_type == msg_type)
        except ValueError:
            return jsonify({'error': 'Invalid message type'}), 400
    
    if party_id:
        query = query.filter(ChatMessage.party_id == party_id)
    else:
        # For non-party messages, include public and messages involving the user
        query = query.filter(
            or_(
                ChatMessage.message_type == ChatMessageType.PUBLIC,
                ChatMessage.sender_id == user_id,
                ChatMessage.recipient_id == user_id
            )
        )
    
    messages = query.order_by(ChatMessage.timestamp.desc()).limit(limit).all()
    
    return jsonify({
        'messages': [msg.to_dict() for msg in reversed(messages)]
    })