"""
Database models for RuneRogue social systems.
"""

from datetime import datetime, timezone # type: ignore
from enum import Enum
from flask_sqlalchemy import SQLAlchemy # type: ignore

db = SQLAlchemy() # type: ignore


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


class User(db.Model): # type: ignore
    """User model for social systems."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True) # type: ignore
    username = db.Column(db.String(80), unique=True, nullable=False) # type: ignore
    email = db.Column(db.String(120), unique=True, nullable=False) # type: ignore
    status = db.Column(db.Enum(UserStatus), default=UserStatus.OFFLINE) # type: ignore
    last_seen = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc)) # type: ignore
    
    # Relationships
    sent_friend_requests = db.relationship( # type: ignore
        'Friendship',
        foreign_keys='Friendship.requester_id',
        backref='requester',
        lazy='dynamic'
    )
    received_friend_requests = db.relationship( # type: ignore
        'Friendship',
        foreign_keys='Friendship.addressee_id',
        backref='addressee', 
        lazy='dynamic'
    )
    party_memberships = db.relationship( # type: ignore
        'PartyMember',
        backref='user',
        lazy='dynamic'
    )
    sent_messages = db.relationship( # type: ignore
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


class Friendship(db.Model): # type: ignore
    """Friendship model for managing friend relationships."""
    
    __tablename__ = 'friendships'
    
    id = db.Column(db.Integer, primary_key=True) # type: ignore
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                            nullable=False) # type: ignore
    addressee_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                            nullable=False) # type: ignore
    status = db.Column(db.Enum(FriendshipStatus), 
                      default=FriendshipStatus.PENDING) # type: ignore
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc),
                          onupdate=datetime.now(timezone.utc)) # type: ignore
    
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


class Party(db.Model): # type: ignore
    """Party model for group management."""
    
    __tablename__ = 'parties'
    
    id = db.Column(db.Integer, primary_key=True) # type: ignore
    name = db.Column(db.String(100), nullable=False) # type: ignore
    leader_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                         nullable=False) # type: ignore
    max_members = db.Column(db.Integer, default=4) # type: ignore
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    
    # Relationships
    leader = db.relationship('User', backref='led_parties') # type: ignore
    members = db.relationship('PartyMember', backref='party', lazy='dynamic') # type: ignore
    
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


class PartyMember(db.Model): # type: ignore
    """Party membership model."""
    
    __tablename__ = 'party_members'
    
    id = db.Column(db.Integer, primary_key=True) # type: ignore
    party_id = db.Column(db.Integer, db.ForeignKey('parties.id'), 
                        nullable=False) # type: ignore
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), 
                       nullable=False) # type: ignore
    joined_at = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    
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


class ImprovementSuggestion(db.Model): # type: ignore
    """Model for storing self-building improvement suggestions."""
    
    __tablename__ = 'improvement_suggestions'

    id = db.Column(db.Integer, primary_key=True) # type: ignore
    type = db.Column(db.String(50), nullable=False) # type: ignore
    priority = db.Column(db.String(50), nullable=False) # type: ignore
    title = db.Column(db.String(255), nullable=False) # type: ignore
    description = db.Column(db.Text, nullable=False) # type: ignore
    action = db.Column(db.String(255), nullable=True) # type: ignore
    risk_level = db.Column(db.String(50), nullable=True) # type: ignore
    milestone = db.Column(db.String(50), nullable=True) # type: ignore
    status = db.Column(db.String(50), default='pending', nullable=False) # type: ignore
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False) # type: ignore
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False) # type: ignore

    def __repr__(self):
        return f'<ImprovementSuggestion {self.id}: {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'priority': self.priority,
            'title': self.title,
            'description': self.description,
            'action': self.action,
            'risk_level': self.risk_level,
            'milestone': self.milestone,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ChatMessage(db.Model): # type: ignore
    """Chat message model."""
    
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True) # type: ignore
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'),
                         nullable=False) # type: ignore
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'),
                           nullable=True)  # Null for public messages
    party_id = db.Column(db.Integer, db.ForeignKey('parties.id'),
                        nullable=True)  # For party chat
    message_type = db.Column(db.Enum(ChatMessageType), nullable=False) # type: ignore
    content = db.Column(db.Text, nullable=False) # type: ignore
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc)) # type: ignore
    
    # Relationships
    recipient = db.relationship('User', foreign_keys=[recipient_id]) # type: ignore
    party = db.relationship('Party', backref='messages') # type: ignore
    
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