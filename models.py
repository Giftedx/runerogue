"""
Database models for RuneRogue social systems.
"""

from datetime import datetime
from enum import Enum
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class UserStatus(Enum):
    """User online status enumeration."""
    ONLINE = "online"
    AWAY = "away"
    BUSY = "busy"
    OFFLINE = "offline"


class FriendshipStatus(Enum):
    """Friendship status enumeration."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class ChatMessageType(Enum):
    """Chat message type enumeration."""
    PUBLIC = "public"
    PRIVATE = "private"
    PARTY = "party"
    WHISPER = "whisper"


class User(db.Model):
    """User model for social systems."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    status = db.Column(db.Enum(UserStatus), default=UserStatus.OFFLINE)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sent_friend_requests = db.relationship(
        'Friendship',
        foreign_keys='Friendship.requester_id',
        backref='requester',
        lazy='dynamic'
    )
    received_friend_requests = db.relationship(
        'Friendship',
        foreign_keys='Friendship.addressee_id',
        backref='addressee', 
        lazy='dynamic'
    )
    party_memberships = db.relationship(
        'PartyMember',
        backref='user',
        lazy='dynamic'
    )
    sent_messages = db.relationship(
        'ChatMessage',
        foreign_keys='ChatMessage.sender_id',
        backref='sender',
        lazy='dynamic'
    )
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        """Convert user to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'status': self.status.value,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None
        }


class Friendship(db.Model):
    """Friendship model for managing friend relationships."""
    
    __tablename__ = 'friendships'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                            nullable=False)
    addressee_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                            nullable=False)
    status = db.Column(db.Enum(FriendshipStatus), 
                      default=FriendshipStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                          onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('requester_id', 'addressee_id'),
    )
    
    def to_dict(self):
        """Convert friendship to dictionary."""
        return {
            'id': self.id,
            'requester': self.requester.to_dict(),
            'addressee': self.addressee.to_dict(),
            'status': self.status.value,
            'created_at': self.created_at.isoformat()
        }


class Party(db.Model):
    """Party model for group management."""
    
    __tablename__ = 'parties'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                         nullable=False)
    max_members = db.Column(db.Integer, default=4)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    leader = db.relationship('User', backref='led_parties')
    members = db.relationship('PartyMember', backref='party', lazy='dynamic')
    
    def __repr__(self):
        return f'<Party {self.name}>'
    
    def to_dict(self):
        """Convert party to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'leader': self.leader.to_dict(),
            'members': [member.to_dict() for member in self.members],
            'max_members': self.max_members,
            'created_at': self.created_at.isoformat()
        }


class PartyMember(db.Model):
    """Party membership model."""
    
    __tablename__ = 'party_members'
    
    id = db.Column(db.Integer, primary_key=True)
    party_id = db.Column(db.Integer, db.ForeignKey('parties.id'), 
                        nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                       nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('party_id', 'user_id'),
    )
    
    def to_dict(self):
        """Convert party member to dictionary."""
        return {
            'id': self.id,
            'user': self.user.to_dict(),
            'joined_at': self.joined_at.isoformat()
        }


class ChatMessage(db.Model):
    """Chat message model."""
    
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'),
                         nullable=False)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'),
                           nullable=True)  # Null for public messages
    party_id = db.Column(db.Integer, db.ForeignKey('parties.id'),
                        nullable=True)  # For party chat
    message_type = db.Column(db.Enum(ChatMessageType), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    recipient = db.relationship('User', foreign_keys=[recipient_id])
    party = db.relationship('Party', backref='messages')
    
    def __repr__(self):
        return f'<ChatMessage {self.id}: {self.message_type.value}>'
    
    def to_dict(self):
        """Convert chat message to dictionary."""
        return {
            'id': self.id,
            'sender': self.sender.to_dict(),
            'recipient': self.recipient.to_dict() if self.recipient else None,
            'party_id': self.party_id,
            'message_type': self.message_type.value,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }