# RuneRogue Social API Documentation

## Overview

The RuneRogue Social API provides multiplayer, party, and social features including friends management, party systems, and real-time chat functionality.

## Features

### Social Systems
- **Friends List**: Send, accept, and manage friend requests
- **User Presence**: Online status tracking and updates
- **Block/Ignore**: Manage blocked users (via friendship status)

### Party System
- **Party Creation**: Create and manage parties with up to 4 members
- **Party Invites**: Invite friends to join parties
- **Shared Mechanics**: Party membership tracking for shared loot/XP
- **Party Chat**: Real-time party-specific messaging

### Chat System
- **Public Chat**: Global chat visible to all users
- **Private Messages**: Direct messages between users
- **Whisper**: Alternative private messaging
- **Party Chat**: Messages within party groups
- **Real-time**: WebSocket-based real-time message delivery

## API Endpoints

### User Management

#### Create User
```http
POST /api/social/users
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com"
}
```

#### Update User Status
```http
PUT /api/social/users/{user_id}/status
Content-Type: application/json

{
  "status": "online|away|busy|offline"
}
```

### Friends Management

#### Get Friends List
```http
GET /api/social/users/{user_id}/friends
```

#### Send Friend Request
```http
POST /api/social/users/{user_id}/friend-requests
Content-Type: application/json

{
  "target_user_id": 123
}
```

#### Respond to Friend Request
```http
PUT /api/social/friend-requests/{request_id}/respond
Content-Type: application/json

{
  "action": "accept|reject"
}
```

### Party Management

#### Create Party
```http
POST /api/social/parties
Content-Type: application/json

{
  "name": "Dungeon Crawlers",
  "leader_id": 123,
  "max_members": 4
}
```

#### Invite to Party
```http
POST /api/social/parties/{party_id}/invite
Content-Type: application/json

{
  "user_id": 456
}
```

#### Leave Party
```http
POST /api/social/parties/{party_id}/leave
Content-Type: application/json

{
  "user_id": 456
}
```

### Chat System

#### Send Message
```http
POST /api/social/chat/send
Content-Type: application/json

{
  "sender_id": 123,
  "message_type": "public|private|party|whisper",
  "content": "Hello world!",
  "recipient_id": 456,  // For private/whisper messages
  "party_id": 789       // For party messages
}
```

#### Get Messages
```http
GET /api/social/chat/messages?user_id=123&type=public&limit=50
```

## WebSocket Events

### Connection Events

#### Connect to Server
```javascript
// Client connects and receives confirmation
socket.on('connected', function(data) {
  console.log(data.message); // "Connected to RuneRogue"
});
```

#### User Login
```javascript
// Login and start presence tracking
socket.emit('user_login', {user_id: 123});

socket.on('login_success', function(data) {
  console.log('Logged in as:', data.user);
});

socket.on('user_online', function(data) {
  console.log('User came online:', data.user);
});
```

### Real-time Messaging

#### Send Message
```javascript
socket.emit('send_message', {
  message_type: 'public',
  content: 'Hello everyone!'
});

socket.on('message_sent', function(data) {
  console.log('Message sent:', data);
});
```

#### Receive Messages
```javascript
socket.on('new_message', function(data) {
  console.log('New message:', data);
  // Display message in chat UI
});
```

### Party Features

#### Join Party Room
```javascript
socket.emit('join_party', {party_id: 123});

socket.on('joined_party', function(data) {
  console.log('Joined party room:', data.party_id);
});
```

#### Leave Party Room
```javascript
socket.emit('leave_party', {party_id: 123});

socket.on('left_party', function(data) {
  console.log('Left party room:', data.party_id);
});
```

### Status Updates

#### Update Status
```javascript
socket.emit('update_status', {status: 'away'});

socket.on('status_updated', function(data) {
  console.log('Status updated to:', data.status);
});

socket.on('user_status_updated', function(data) {
  console.log('Friend status changed:', data);
});
```

## Database Models

### User
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `status`: Online status (online, away, busy, offline)
- `last_seen`: Last activity timestamp
- `created_at`: Account creation timestamp

### Friendship
- `id`: Primary key
- `requester_id`: User who sent the request
- `addressee_id`: User who received the request
- `status`: Friendship status (pending, accepted, blocked)
- `created_at`: Request timestamp
- `updated_at`: Last update timestamp

### Party
- `id`: Primary key
- `name`: Party name
- `leader_id`: Party leader user ID
- `max_members`: Maximum party size (default: 4)
- `created_at`: Party creation timestamp

### PartyMember
- `id`: Primary key
- `party_id`: Party reference
- `user_id`: User reference
- `joined_at`: Membership timestamp

### ChatMessage
- `id`: Primary key
- `sender_id`: Message sender
- `recipient_id`: Message recipient (for private messages)
- `party_id`: Party reference (for party messages)
- `message_type`: Type of message (public, private, party, whisper)
- `content`: Message content
- `timestamp`: Message timestamp

## Integration with Godot

The API is designed to support a Godot client through:

1. **REST API**: Standard HTTP endpoints for CRUD operations
2. **WebSocket API**: Real-time communication for chat and presence
3. **JSON Responses**: All responses use JSON format
4. **CORS Support**: Cross-origin requests enabled for web clients

### Example Godot Integration

```gdscript
# In Godot, use HTTPRequest for REST API calls
func send_friend_request(user_id: int, target_id: int):
    var http_request = HTTPRequest.new()
    var url = "http://localhost:5000/api/social/users/%d/friend-requests" % user_id
    var headers = ["Content-Type: application/json"]
    var body = JSON.stringify({"target_user_id": target_id})
    
    http_request.request(url, headers, true, HTTPClient.METHOD_POST, body)

# Use WebSocketClient for real-time features
var websocket = WebSocketClient.new()
websocket.connect_to_url("ws://localhost:5000")
websocket.get_peer(1).put_packet(JSON.stringify({
    "event": "send_message",
    "data": {
        "message_type": "public",
        "content": "Hello from Godot!"
    }
}).to_utf8())
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200`: Success
- `201`: Created successfully
- `400`: Bad request (missing/invalid data)
- `404`: Resource not found
- `409`: Conflict (duplicate resource)
- `500`: Internal server error

Error responses include descriptive messages:

```json
{
  "error": "Username and email required"
}
```

## Security Considerations

- Input validation on all endpoints
- SQL injection protection via SQLAlchemy ORM
- User authentication required for sensitive operations
- WebSocket authentication tracking
- Rate limiting (recommended for production)

## Testing

Comprehensive test coverage is provided in `tests/test_social.py`:

```bash
# Run social system tests
pytest tests/test_social.py -v

# Run all tests
pytest tests/ -v
```

## Performance Notes

- Database uses SQLite for development (recommend PostgreSQL for production)
- WebSocket connections are tracked in memory
- Message history is persisted in database
- Consider implementing message pagination for large chat histories
- Friend list queries are optimized with proper indexing