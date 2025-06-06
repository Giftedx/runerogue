# Economy Database Schema Documentation

This document outlines the database schema for the RuneRogue economy system, as defined in `economy_models/economy.py`. The schema is built using SQLAlchemy, representing various entities and their relationships.

## Table of Contents

- [Enums](#enums)
  - [TradeStatus](#tradestatus)
  - [OfferType](#offertype)
  - [OfferStatus](#offerstatus)
- [Models](#models)
  - [Player](#player)
  - [Item](#item)
  - [InventoryItem](#inventoryitem)
  - [Trade](#trade)
  - [TradeItem](#tradeitem)
  - [GrandExchangeOffer](#grandexchangeoffer)
  - [GrandExchangeTransaction](#grandexchangetransaction)
  - [PriceHistory](#pricehistory)
  - [AuditLog](#auditlog)

## Enums

### TradeStatus

Represents the status of a trade between players.

| Value       | Description                              |
| ----------- | ---------------------------------------- |
| `PENDING`   | Trade request has been sent.             |
| `ACCEPTED`  | Trade has been accepted by both parties. |
| `DECLINED`  | Trade request has been declined.         |
| `COMPLETED` | Trade has been successfully completed.   |
| `CANCELLED` | Trade has been cancelled.                |

### OfferType

Represents the type of a Grand Exchange offer.

| Value  | Description             |
| ------ | ----------------------- |
| `BUY`  | An offer to buy items.  |
| `SELL` | An offer to sell items. |

### OfferStatus

Represents the status of a Grand Exchange offer.

| Value       | Description                     |
| ----------- | ------------------------------- |
| `ACTIVE`    | Offer is currently active.      |
| `COMPLETED` | Offer has been fully completed. |
| `CANCELLED` | Offer has been cancelled.       |
| `EXPIRED`   | Offer has expired.              |

## Models

### Player

Represents a player in the economy system.

| Column       | Type          | Constraints/Description   |
| ------------ | ------------- | ------------------------- |
| `id`         | `Integer`     | Primary Key               |
| `username`   | `String(50)`  | Unique, Not Null, Indexed |
| `email`      | `String(120)` | Unique, Not Null          |
| `is_active`  | `Boolean`     | Default: `True`           |
| `created_at` | `DateTime`    | Default: `utcnow`         |
| `last_login` | `DateTime`    |                           |

**Relationships:**

- `inventory_items`: One-to-many relationship with `InventoryItem`.
- `sent_trades`: One-to-many relationship with `Trade` (as initiator).
- `received_trades`: One-to-many relationship with `Trade` (as receiver).
- `ge_offers`: One-to-many relationship with `GrandExchangeOffer`.

### Item

Represents a tradeable item in the game.

| Column         | Type            | Constraints/Description |
| -------------- | --------------- | ----------------------- |
| `id`           | `Integer`       | Primary Key             |
| `name`         | `String(100)`   | Not Null, Indexed       |
| `description`  | `Text`          |                         |
| `is_tradeable` | `Boolean`       | Default: `True`         |
| `is_stackable` | `Boolean`       | Default: `False`        |
| `base_value`   | `Numeric(10,2)` | Default: `0`            |
| `created_at`   | `DateTime`      | Default: `utcnow`       |

**Relationships:**

- `inventory_items`: One-to-many relationship with `InventoryItem`.
- `trade_items`: One-to-many relationship with `TradeItem`.
- `ge_offers`: One-to-many relationship with `GrandExchangeOffer`.
- `price_history`: One-to-many relationship with `PriceHistory`.

### InventoryItem

Represents an item in a player's inventory.

| Column        | Type       | Constraints/Description               |
| ------------- | ---------- | ------------------------------------- |
| `id`          | `Integer`  | Primary Key                           |
| `player_id`   | `Integer`  | Foreign Key to `players.id`, Not Null |
| `item_id`     | `Integer`  | Foreign Key to `items.id`, Not Null   |
| `quantity`    | `Integer`  | Default: `1`                          |
| `acquired_at` | `DateTime` | Default: `utcnow`                     |

**Relationships:**

- `player`: Many-to-one relationship with `Player`.
- `item`: Many-to-one relationship with `Item`.

**Indexes:**

- `idx_player_item`: Composite index on `player_id`, `item_id`.

### Trade

Represents a direct player-to-player trade.

| Column         | Type         | Constraints/Description               |
| -------------- | ------------ | ------------------------------------- |
| `id`           | `Integer`    | Primary Key                           |
| `initiator_id` | `Integer`    | Foreign Key to `players.id`, Not Null |
| `receiver_id`  | `Integer`    | Foreign Key to `players.id`, Not Null |
| `status`       | `String(20)` | Default: `PENDING`                    |
| `initiated_at` | `DateTime`   | Default: `utcnow`                     |
| `completed_at` | `DateTime`   |                                       |
| `cancelled_at` | `DateTime`   |                                       |
| `notes`        | `Text`       |                                       |

**Relationships:**

- `initiator`: Many-to-one relationship with `Player` (as initiator).
- `receiver`: Many-to-one relationship with `Player` (as receiver).
- `trade_items`: One-to-many relationship with `TradeItem`.
- `audit_logs`: One-to-many relationship with `AuditLog`.

**Indexes:**

- `idx_trade_status`: Index on `status`.
- `idx_trade_players`: Composite index on `initiator_id`, `receiver_id`.

### TradeItem

Represents an item included in a trade.

| Column           | Type      | Constraints/Description               |
| ---------------- | --------- | ------------------------------------- |
| `id`             | `Integer` | Primary Key                           |
| `trade_id`       | `Integer` | Foreign Key to `trades.id`, Not Null  |
| `item_id`        | `Integer` | Foreign Key to `items.id`, Not Null   |
| `quantity`       | `Integer` | Not Null                              |
| `from_player_id` | `Integer` | Foreign Key to `players.id`, Not Null |
| `to_player_id`   | `Integer` | Foreign Key to `players.id`, Not Null |

**Relationships:**

- `trade`: Many-to-one relationship with `Trade`.
- `item`: Many-to-one relationship with `Item`.

### GrandExchangeOffer

Represents a buy or sell offer on the Grand Exchange.

| Column               | Type            | Constraints/Description               |
| -------------------- | --------------- | ------------------------------------- |
| `id`                 | `Integer`       | Primary Key                           |
| `player_id`          | `Integer`       | Foreign Key to `players.id`, Not Null |
| `item_id`            | `Integer`       | Foreign Key to `items.id`, Not Null   |
| `offer_type`         | `String(10)`    | Not Null (`buy` or `sell`)            |
| `quantity`           | `Integer`       | Not Null                              |
| `price_per_item`     | `Numeric(10,2)` | Not Null                              |
| `quantity_remaining` | `Integer`       |                                       |
| `status`             | `String(20)`    | Default: `ACTIVE`                     |
| `created_at`         | `DateTime`      | Default: `utcnow`                     |
| `completed_at`       | `DateTime`      |                                       |
| `expires_at`         | `DateTime`      |                                       |

**Relationships:**

- `player`: Many-to-one relationship with `Player`.
- `item`: Many-to-one relationship with `Item`.
- `transactions`: One-to-many relationship with `GrandExchangeTransaction`.

**Indexes:**

- `idx_ge_item_type`: Composite index on `item_id`, `offer_type`.
- `idx_ge_status`: Index on `status`.
- `idx_ge_price`: Index on `price_per_item`.

### GrandExchangeTransaction

Represents a completed transaction on the Grand Exchange.

| Column           | Type            | Constraints/Description                 |
| ---------------- | --------------- | --------------------------------------- |
| `id`             | `Integer`       | Primary Key                             |
| `offer_id`       | `Integer`       | Foreign Key to `ge_offers.id`, Not Null |
| `buyer_id`       | `Integer`       | Foreign Key to `players.id`, Not Null   |
| `seller_id`      | `Integer`       | Foreign Key to `players.id`, Not Null   |
| `item_id`        | `Integer`       | Foreign Key to `items.id`, Not Null     |
| `quantity`       | `Integer`       | Not Null                                |
| `price_per_item` | `Numeric(10,2)` | Not Null                                |
| `total_price`    | `Numeric(12,2)` | Not Null                                |
| `completed_at`   | `DateTime`      | Default: `utcnow`                       |

**Relationships:**

- `offer`: Many-to-one relationship with `GrandExchangeOffer`.
- `buyer`: Many-to-one relationship with `Player` (as buyer).
- `seller`: Many-to-one relationship with `Player` (as seller).
- `item`: Many-to-one relationship with `Item`.

### PriceHistory

Tracks the historical prices of items.

| Column      | Type            | Constraints/Description                  |
| ----------- | --------------- | ---------------------------------------- |
| `id`        | `Integer`       | Primary Key                              |
| `item_id`   | `Integer`       | Foreign Key to `items.id`, Not Null      |
| `timestamp` | `DateTime`      | Default: `utcnow`, Not Null              |
| `avg_price` | `Numeric(10,2)` | Average price at the timestamp, Not Null |
| `min_price` | `Numeric(10,2)` | Minimum observed price, Not Null         |
| `max_price` | `Numeric(10,2)` | Maximum observed price, Not Null         |

**Relationships:**

- `item`: Many-to-one relationship with `Item`.

**Indexes:**

- `idx_price_history_item_timestamp`: Composite index on `item_id`, `timestamp`.

### AuditLog

Logs significant economic actions.

| Column        | Type         | Constraints/Description                             |
| ------------- | ------------ | --------------------------------------------------- |
| `id`          | `Integer`    | Primary Key                                         |
| `player_id`   | `Integer`    | Foreign Key to `players.id`, Nullable               |
| `trade_id`    | `Integer`    | Foreign Key to `trades.id`, Nullable                |
| `action_type` | `String(50)` | Not Null (e.g., `TRADE_INITIATED`, `ITEM_ACQUIRED`) |
| `details`     | `Text`       | JSON string of action details                       |
| `timestamp`   | `DateTime`   | Default: `utcnow`, Not Null                         |

**Relationships:**

- `player`: Many-to-one relationship with `Player`.
- `trade`: Many-to-one relationship with `Trade`.

**Indexes:**

- `idx_audit_log_player`: Index on `player_id`.
- `idx_audit_log_action_type`: Index on `action_type`.
- `idx_audit_log_timestamp`: Index on `timestamp`.
