# Database Schema Documentation

This document outlines the database schema for the RuneRogue social systems, as defined in `models.py`. The schema is built using SQLAlchemy and Flask-SQLAlchemy, representing various entities and their relationships.

## Table of Contents

- [Enums](#enums)
  - [UserStatus](#userstatus)
  - [FriendshipStatus](#friendshipstatus)
  - [ChatMessageType](#chatmessagetype)
- [Models](#models)
  - [User](#user)
  - [Friendship](#friendship)
  - [Party](#party)
  - [PartyMember](#partymember)
  - [ChatMessage](#chatmessage)
  - [ImprovementSuggestion](#improvementsuggestion)

## Enums

### UserStatus

Represents the online status of a user.

| Value   | Description                    |
|---------|--------------------------------|
| `ONLINE`  | User is currently online.      |
| `AWAY`    | User is away from their device. |
| `BUSY`    | User is busy.                  |
| `OFFLINE` | User is offline.               |

### FriendshipStatus

Represents the status of a friendship request or relationship.

| Value      | Description                               |
|------------|-------------------------------------------|
| `PENDING`  | Friendship request has been sent but not yet accepted. |
| `ACCEPTED` | Friendship request has been accepted.     |
| `BLOCKED`  | User has blocked another user.            |

### ChatMessageType

Represents the type of a chat message.

| Value     | Description                               |
|-----------|-------------------------------------------|
| `PUBLIC`  | Message sent to a public channel.         |
| `PRIVATE` | Message sent directly to another user (whisper). |
| `PARTY`   | Message sent within a party.              |
| `WHISPER` | Alias for private message.                |

## Models

### User

Represents a user in the social system.

| Column       | Type                            | Constraints/Description                               |
|--------------|---------------------------------|-------------------------------------------------------|
| `id`         | `Integer`                       | Primary Key                                           |
| `username`   | `String(80)`                    | Unique, Not Null                                      |
| `email`      | `String(120)`                   | Unique, Not Null                                      |
| `status`     | `Enum(UserStatus)`              | Default: `OFFLINE`                                    |
| `last_seen`  | `DateTime`                      | Last time the user was active, Default: `utcnow`      |
| `created_at` | `DateTime`                      | Timestamp of user creation, Default: `utcnow`         |

**Relationships:**

- `sent_friend_requests`: One-to-many relationship with `Friendship` (as requester).
- `received_friend_requests`: One-to-many relationship with `Friendship` (as addressee).
- `party_memberships`: One-to-many relationship with `PartyMember`.
- `sent_messages`: One-to-many relationship with `ChatMessage` (as sender).

### Friendship

Manages friend relationships between users.

| Column         | Type                     | Constraints/Description                               |
|----------------|--------------------------|-------------------------------------------------------|
| `id`           | `Integer`                | Primary Key                                           |
| `requester_id` | `Integer`                | Foreign Key to `users.id`, Not Null                   |
| `addressee_id` | `Integer`                | Foreign Key to `users.id`, Not Null                   |
| `status`       | `Enum(FriendshipStatus)` | Default: `PENDING`                                    |
| `created_at`   | `DateTime`               | Timestamp of request creation, Default: `utcnow`      |
| `updated_at`   | `DateTime`               | Last update timestamp, Default/OnUpdate: `utcnow`     |

**Constraints:**

- Unique constraint on `(requester_id, addressee_id)`.

### Party

Manages groups of users (parties).

| Column        | Type        | Constraints/Description                               |
|---------------|-------------|-------------------------------------------------------|
| `id`          | `Integer`   | Primary Key                                           |
| `name`        | `String(100)` | Not Null                                              |
| `leader_id`   | `Integer`   | Foreign Key to `users.id`, Not Null                   |
| `max_members` | `Integer`   | Default: `4`                                          |
| `created_at`  | `DateTime`  | Timestamp of party creation, Default: `utcnow`        |

**Relationships:**

- `leader`: One-to-one relationship with `User`.
- `members`: One-to-many relationship with `PartyMember`.
- `messages`: One-to-many relationship with `ChatMessage` (for party chat).

### PartyMember

Represents a user's membership in a party.

| Column      | Type      | Constraints/Description                               |
|-------------|-----------|-------------------------------------------------------|
| `id`        | `Integer` | Primary Key                                           |
| `party_id`  | `Integer` | Foreign Key to `parties.id`, Not Null                 |
| `user_id`   | `Integer` | Foreign Key to `users.id`, Not Null                   |
| `joined_at` | `DateTime`| Timestamp of joining the party, Default: `utcnow`     |

**Constraints:**

- Unique constraint on `(party_id, user_id)`.

### ChatMessage

Represents a chat message sent within the system.

| Column         | Type                     | Constraints/Description                               |
|----------------|--------------------------|-------------------------------------------------------|
| `id`           | `Integer`                | Primary Key                                           |
| `sender_id`    | `Integer`                | Foreign Key to `users.id`, Not Null                   |
| `recipient_id` | `Integer`                | Foreign Key to `users.id`, Nullable (for public/party) |
| `party_id`     | `Integer`                | Foreign Key to `parties.id`, Nullable (for private/public) |
| `message_type` | `Enum(ChatMessageType)`  | Not Null                                              |
| `content`      | `Text`                   | Not Null                                              |
| `timestamp`    | `DateTime`               | Timestamp of message, Default: `utcnow`               |

**Relationships:**

- `sender`: Many-to-one relationship with `User`.
- `recipient`: Many-to-one relationship with `User` (if private message).
- `party`: Many-to-one relationship with `Party` (if party message).

### ImprovementSuggestion

Manages self-building improvement suggestions.

| Column       | Type                     | Constraints/Description                               |
|--------------|--------------------------|-------------------------------------------------------|
| `id`         | `Integer`                | Primary Key                                           |
| `type`       | `String(50)`             | Not Null                                              |
| `priority`   | `String(50)`             | Not Null                                              |
| `title`      | `String(255)`            | Not Null                                              |
| `description`| `Text`                   | Not Null                                              |
| `action`     | `String(255)`            | Nullable                                              |
| `risk_level` | `String(50)`             | Nullable                                              |
| `milestone`  | `String(50)`             | Nullable                                              |
| `status`     | `String(50)`             | Default: `pending`, Not Null                          |
| `created_at` | `DateTime`               | Timestamp of creation, Default: `utcnow`, Not Null    |
| `updated_at` | `DateTime`               | Last update timestamp, Default/OnUpdate: `utcnow`, Not Null |
