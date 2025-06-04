"""
Real-time communication using WebSockets for RuneRogue social features.
"""

import logging
from flask import request
from flask_socketio import SocketIO, emit, join_room, leave_room

from models import User, ChatMessage, ChatMessageType, db

logger = logging.getLogger(__name__)

socketio = SocketIO()

# Store user session mapping
user_sessions = {}  # user_id -> session_id
session_users = {}  # session_id -> user_id


@socketio.on('connect')
def on_connect():
    """Handle client connection."""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to RuneRogue'})


@socketio.on('disconnect')
def on_disconnect():
    """Handle client disconnection."""
    session_id = request.sid
    if session_id in session_users:
        user_id = session_users[session_id]
        logger.info(f"User {user_id} disconnected")
        
        # Update user status to offline
        try:
            user = User.query.get(user_id)
            if user:
                user.status = 'offline'
                db.session.commit()
        except Exception as e:
            logger.error(f"Error updating user status on disconnect: {e}")
            db.session.rollback()
        
        # Clean up session tracking
        if user_id in user_sessions:
            del user_sessions[user_id]
        del session_users[session_id]


@socketio.on('user_login')
def on_user_login(data):
    """Handle user login and presence tracking."""
    user_id = data.get('user_id')
    if not user_id:
        emit('error', {'message': 'User ID required'})
        return
    
    try:
        user = User.query.get(user_id)
        if not user:
            emit('error', {'message': 'User not found'})
            return
        
        # Track user session
        session_id = request.sid
        user_sessions[user_id] = session_id
        session_users[session_id] = user_id
        
        # Update user status
        user.status = 'online'
        db.session.commit()
        
        # Join user's personal room for private messages
        join_room(f"user_{user_id}")
        
        logger.info(f"User {user.username} logged in")
        emit('login_success', {'user': user.to_dict()})
        
        # Notify friends of online status
        emit('user_online', {'user': user.to_dict()}, broadcast=True)
        
    except Exception as e:
        logger.error(f"Error during user login: {e}")
        db.session.rollback()
        emit('error', {'message': 'Login failed'})


@socketio.on('send_message')
def on_send_message(data):
    """Handle real-time message sending."""
    session_id = request.sid
    if session_id not in session_users:
        emit('error', {'message': 'Not authenticated'})
        return
    
    sender_id = session_users[session_id]
    
    required_fields = ['message_type', 'content']
    if not all(field in data for field in required_fields):
        emit('error', {'message': 'Missing required fields'})
        return
    
    try:
        message_type = ChatMessageType(data['message_type'])
    except ValueError:
        emit('error', {'message': 'Invalid message type'})
        return
    
    try:
        sender = User.query.get(sender_id)
        if not sender:
            emit('error', {'message': 'Sender not found'})
            return
        
        # Create message
        message = ChatMessage(
            sender_id=sender_id,
            message_type=message_type,
            content=data['content']
        )
        
        # Handle different message types
        if message_type in [ChatMessageType.PRIVATE, ChatMessageType.WHISPER]:
            recipient_id = data.get('recipient_id')
            if not recipient_id:
                emit('error', {'message': 'Recipient required'})
                return
            
            recipient = User.query.get(recipient_id)
            if not recipient:
                emit('error', {'message': 'Recipient not found'})
                return
            
            message.recipient_id = recipient_id
            
            # Send to recipient's room
            socketio.emit('new_message', message.to_dict(), 
                         room=f"user_{recipient_id}")
            
        elif message_type == ChatMessageType.PARTY:
            party_id = data.get('party_id')
            if not party_id:
                emit('error', {'message': 'Party ID required'})
                return
            
            message.party_id = party_id
            
            # Send to party room
            socketio.emit('new_message', message.to_dict(), 
                         room=f"party_{party_id}")
            
        elif message_type == ChatMessageType.PUBLIC:
            # Send to all connected users
            socketio.emit('new_message', message.to_dict(), broadcast=True)
        
        # Save message to database
        db.session.add(message)
        db.session.commit()
        
        # Confirm to sender
        emit('message_sent', message.to_dict())
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        db.session.rollback()
        emit('error', {'message': 'Failed to send message'})


@socketio.on('join_party')
def on_join_party(data):
    """Handle joining party room for real-time communication."""
    session_id = request.sid
    if session_id not in session_users:
        emit('error', {'message': 'Not authenticated'})
        return
    
    party_id = data.get('party_id')
    if not party_id:
        emit('error', {'message': 'Party ID required'})
        return
    
    join_room(f"party_{party_id}")
    emit('joined_party', {'party_id': party_id})


@socketio.on('leave_party')
def on_leave_party(data):
    """Handle leaving party room."""
    session_id = request.sid
    if session_id not in session_users:
        emit('error', {'message': 'Not authenticated'})
        return
    
    party_id = data.get('party_id')
    if not party_id:
        emit('error', {'message': 'Party ID required'})
        return
    
    leave_room(f"party_{party_id}")
    emit('left_party', {'party_id': party_id})


@socketio.on('update_status')
def on_update_status(data):
    """Handle user status updates."""
    session_id = request.sid
    if session_id not in session_users:
        emit('error', {'message': 'Not authenticated'})
        return
    
    user_id = session_users[session_id]
    status = data.get('status')
    
    if not status:
        emit('error', {'message': 'Status required'})
        return
    
    try:
        user = User.query.get(user_id)
        if not user:
            emit('error', {'message': 'User not found'})
            return
        
        user.status = status
        db.session.commit()
        
        # Broadcast status update to friends
        socketio.emit('user_status_updated', {
            'user_id': user_id,
            'status': status
        }, broadcast=True)
        
        emit('status_updated', {'status': status})
        
    except Exception as e:
        logger.error(f"Error updating status: {e}")
        db.session.rollback()
        emit('error', {'message': 'Failed to update status'})


def broadcast_to_friends(user_id, event, data):
    """Broadcast event to user's friends."""
    try:
        # This would require implementing a friends lookup
        # For now, broadcast to all (in a real implementation, 
        # you'd query the user's friends and send only to them)
        socketio.emit(event, data, broadcast=True)
    except Exception as e:
        logger.error(f"Error broadcasting to friends: {e}")


def get_online_friends(user_id):
    """Get list of online friends for a user."""
    try:
        # Implementation would query user's friends and check their status
        # For now, return empty list
        return []
    except Exception as e:
        logger.error(f"Error getting online friends: {e}")
        return []