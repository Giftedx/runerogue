"""
Direct Player-to-Player Trading System

Handles direct trade sessions between players with validation,
anti-fraud protection, and audit logging.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from economy_models.economy import (
    db_manager,
    Player,
    Item,
    InventoryItem,
    Trade,
    TradeItem,
    TradeStatus,
    AuditLog,
)

logger = logging.getLogger(__name__)


class TradingError(Exception):
    """Base exception for trading operations."""
    pass


class InsufficientItemsError(TradingError):
    """Raised when player doesn't have enough items to trade."""
    pass


class InvalidTradeError(TradingError):
    """Raised when trade is invalid or not allowed."""
    pass


class TradingSystem:
    """Direct player-to-player trading system."""

    def __init__(self):
        self.db = db_manager

    def initiate_trade(
        self,
        initiator_id: int,
        receiver_id: int,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Initiate a new trade between two players.

        Args:
            initiator_id: ID of player starting the trade
            receiver_id: ID of player receiving trade request
            notes: Optional notes for the trade

        Returns:
            Dict containing trade information

        Raises:
            InvalidTradeError: If trade cannot be initiated
        """
        if initiator_id == receiver_id:
            raise InvalidTradeError("Cannot trade with yourself")

        session = self.db.get_session()
        try:
            # Verify both players exist and are active
            initiator = session.query(Player).filter(
                Player.id == initiator_id,
                Player.is_active == True
            ).first()

            receiver = session.query(Player).filter(
                Player.id == receiver_id,
                Player.is_active == True
            ).first()

            if not initiator:
                raise InvalidTradeError("Initiator not found or inactive")
            if not receiver:
                raise InvalidTradeError("Receiver not found or inactive")

            # Check for existing pending trades between these players
            existing_trade = session.query(Trade).filter(
                ((Trade.initiator_id == initiator_id) &
                 (Trade.receiver_id == receiver_id)) |
                ((Trade.initiator_id == receiver_id) &
                 (Trade.receiver_id == initiator_id)),
                Trade.status == TradeStatus.PENDING.value
            ).first()

            if existing_trade:
                raise InvalidTradeError(
                    "Pending trade already exists between these players"
                )

            # Create new trade
            trade = Trade(
                initiator_id=initiator_id,
                receiver_id=receiver_id,
                status=TradeStatus.PENDING.value,
                notes=notes
            )

            session.add(trade)
            session.commit()

            # Log the action
            self._log_action(
                session,
                player_id=initiator_id,
                trade_id=trade.id,
                action="trade_initiated",
                details=f"Trade initiated with player {receiver_id}"
            )

            logger.info(f"Trade {trade.id} initiated between "
                       f"players {initiator_id} and {receiver_id}")

            return {
                "trade_id": trade.id,
                "status": trade.status,
                "initiated_at": trade.initiated_at.isoformat(),
                "initiator": {
                    "id": initiator.id,
                    "username": initiator.username
                },
                "receiver": {
                    "id": receiver.id,
                    "username": receiver.username
                }
            }

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error initiating trade: {e}")
            raise TradingError("Failed to initiate trade")
        finally:
            session.close()

    def add_item_to_trade(
        self,
        trade_id: int,
        player_id: int,
        item_id: int,
        quantity: int
    ) -> Dict:
        """
        Add an item to a pending trade.

        Args:
            trade_id: ID of the trade
            player_id: ID of player adding the item
            item_id: ID of item to add
            quantity: Quantity of item to add

        Returns:
            Dict containing updated trade information

        Raises:
            InvalidTradeError: If item cannot be added
            InsufficientItemsError: If player doesn't have enough items
        """
        if quantity <= 0:
            raise InvalidTradeError("Quantity must be positive")

        session = self.db.get_session()
        try:
            # Get trade and verify it's pending
            trade = session.query(Trade).filter(
                Trade.id == trade_id,
                Trade.status == TradeStatus.PENDING.value
            ).first()

            if not trade:
                raise InvalidTradeError("Trade not found or not pending")

            # Verify player is part of this trade
            if player_id not in [trade.initiator_id, trade.receiver_id]:
                raise InvalidTradeError("Player not part of this trade")

            # Determine recipient
            recipient_id = (trade.receiver_id if player_id ==
                           trade.initiator_id else trade.initiator_id)

            # Verify item exists and is tradeable
            item = session.query(Item).filter(
                Item.id == item_id,
                Item.is_tradeable == True
            ).first()

            if not item:
                raise InvalidTradeError("Item not found or not tradeable")

            # Check player has sufficient quantity
            inventory_item = session.query(InventoryItem).filter(
                InventoryItem.player_id == player_id,
                InventoryItem.item_id == item_id
            ).first()

            if not inventory_item or inventory_item.quantity < quantity:
                raise InsufficientItemsError(
                    f"Insufficient {item.name} (need {quantity}, "
                    f"have {inventory_item.quantity if inventory_item else 0})"
                )

            # Check if item already added to trade
            existing_trade_item = session.query(TradeItem).filter(
                TradeItem.trade_id == trade_id,
                TradeItem.item_id == item_id,
                TradeItem.from_player_id == player_id
            ).first()

            if existing_trade_item:
                raise InvalidTradeError("Item already added to trade")

            # Add item to trade
            trade_item = TradeItem(
                trade_id=trade_id,
                item_id=item_id,
                quantity=quantity,
                from_player_id=player_id,
                to_player_id=recipient_id
            )

            session.add(trade_item)
            session.commit()

            # Log the action
            self._log_action(
                session,
                player_id=player_id,
                trade_id=trade_id,
                action="item_added_to_trade",
                details=f"Added {quantity} {item.name} to trade"
            )

            logger.info(f"Player {player_id} added {quantity} "
                       f"{item.name} to trade {trade_id}")

            return self.get_trade_details(trade_id)

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error adding item to trade: {e}")
            raise TradingError("Failed to add item to trade")
        finally:
            session.close()

    def accept_trade(self, trade_id: int, player_id: int) -> Dict:
        """
        Accept a pending trade.

        Args:
            trade_id: ID of the trade to accept
            player_id: ID of player accepting the trade

        Returns:
            Dict containing trade result

        Raises:
            InvalidTradeError: If trade cannot be accepted
        """
        session = self.db.get_session()
        try:
            # Get trade and verify it's pending
            trade = session.query(Trade).filter(
                Trade.id == trade_id,
                Trade.status == TradeStatus.PENDING.value
            ).first()

            if not trade:
                raise InvalidTradeError("Trade not found or not pending")

            # Verify player is the receiver
            if player_id != trade.receiver_id:
                raise InvalidTradeError(
                    "Only the receiver can accept the trade"
                )

            # Get all trade items
            trade_items = session.query(TradeItem).filter(
                TradeItem.trade_id == trade_id
            ).all()

            if not trade_items:
                raise InvalidTradeError("No items in trade")

            # Validate all players still have the required items
            for trade_item in trade_items:
                inventory_item = session.query(InventoryItem).filter(
                    InventoryItem.player_id == trade_item.from_player_id,
                    InventoryItem.item_id == trade_item.item_id
                ).first()

                if (not inventory_item or
                        inventory_item.quantity < trade_item.quantity):
                    raise InsufficientItemsError(
                        f"Player {trade_item.from_player_id} no longer has "
                        f"sufficient {trade_item.item.name}"
                    )

            # Execute the trade - transfer items
            for trade_item in trade_items:
                self._transfer_item(
                    session,
                    trade_item.from_player_id,
                    trade_item.to_player_id,
                    trade_item.item_id,
                    trade_item.quantity
                )

            # Update trade status
            trade.status = TradeStatus.COMPLETED.value
            trade.completed_at = datetime.utcnow()

            session.commit()

            # Log the action
            self._log_action(
                session,
                player_id=player_id,
                trade_id=trade_id,
                action="trade_accepted",
                details="Trade completed successfully"
            )

            logger.info(f"Trade {trade_id} completed successfully")

            return {
                "trade_id": trade_id,
                "status": "completed",
                "completed_at": trade.completed_at.isoformat(),
                "message": "Trade completed successfully"
            }

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error accepting trade: {e}")
            raise TradingError("Failed to complete trade")
        finally:
            session.close()

    def decline_trade(self, trade_id: int, player_id: int) -> Dict:
        """
        Decline a pending trade.

        Args:
            trade_id: ID of the trade to decline
            player_id: ID of player declining the trade

        Returns:
            Dict containing trade result
        """
        session = self.db.get_session()
        try:
            trade = session.query(Trade).filter(
                Trade.id == trade_id,
                Trade.status == TradeStatus.PENDING.value
            ).first()

            if not trade:
                raise InvalidTradeError("Trade not found or not pending")

            # Verify player is part of this trade
            if player_id not in [trade.initiator_id, trade.receiver_id]:
                raise InvalidTradeError("Player not part of this trade")

            trade.status = TradeStatus.DECLINED.value
            trade.cancelled_at = datetime.utcnow()

            session.commit()

            # Log the action
            self._log_action(
                session,
                player_id=player_id,
                trade_id=trade_id,
                action="trade_declined",
                details="Trade declined"
            )

            logger.info(f"Trade {trade_id} declined by player {player_id}")

            return {
                "trade_id": trade_id,
                "status": "declined",
                "message": "Trade declined"
            }

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error declining trade: {e}")
            raise TradingError("Failed to decline trade")
        finally:
            session.close()

    def get_trade_details(self, trade_id: int) -> Dict:
        """Get detailed information about a trade."""
        session = self.db.get_session()
        try:
            trade = session.query(Trade).filter(
                Trade.id == trade_id
            ).first()

            if not trade:
                raise InvalidTradeError("Trade not found")

            trade_items = session.query(TradeItem).filter(
                TradeItem.trade_id == trade_id
            ).all()

            items_data = []
            for trade_item in trade_items:
                items_data.append({
                    "item_id": trade_item.item_id,
                    "item_name": trade_item.item.name,
                    "quantity": trade_item.quantity,
                    "from_player_id": trade_item.from_player_id,
                    "to_player_id": trade_item.to_player_id
                })

            return {
                "trade_id": trade.id,
                "status": trade.status,
                "initiator": {
                    "id": trade.initiator.id,
                    "username": trade.initiator.username
                },
                "receiver": {
                    "id": trade.receiver.id,
                    "username": trade.receiver.username
                },
                "items": items_data,
                "initiated_at": trade.initiated_at.isoformat(),
                "completed_at": (trade.completed_at.isoformat()
                               if trade.completed_at else None),
                "notes": trade.notes
            }

        finally:
            session.close()

    def get_player_trades(
        self,
        player_id: int,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get all trades for a player."""
        session = self.db.get_session()
        try:
            query = session.query(Trade).filter(
                (Trade.initiator_id == player_id) |
                (Trade.receiver_id == player_id)
            )

            if status:
                query = query.filter(Trade.status == status)

            trades = query.order_by(Trade.initiated_at.desc()).all()

            trades_data = []
            for trade in trades:
                trades_data.append({
                    "trade_id": trade.id,
                    "status": trade.status,
                    "other_player": {
                        "id": (trade.receiver.id if trade.initiator_id ==
                              player_id else trade.initiator.id),
                        "username": (trade.receiver.username if
                                   trade.initiator_id == player_id
                                   else trade.initiator.username)
                    },
                    "initiated_at": trade.initiated_at.isoformat(),
                    "is_initiator": trade.initiator_id == player_id
                })

            return trades_data

        finally:
            session.close()

    def _transfer_item(
        self,
        session: Session,
        from_player_id: int,
        to_player_id: int,
        item_id: int,
        quantity: int
    ):
        """Transfer items between players."""
        # Remove from sender
        from_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == from_player_id,
            InventoryItem.item_id == item_id
        ).first()

        from_inventory.quantity -= quantity
        if from_inventory.quantity <= 0:
            session.delete(from_inventory)

        # Add to receiver
        to_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == to_player_id,
            InventoryItem.item_id == item_id
        ).first()

        if to_inventory:
            to_inventory.quantity += quantity
        else:
            to_inventory = InventoryItem(
                player_id=to_player_id,
                item_id=item_id,
                quantity=quantity
            )
            session.add(to_inventory)

    def _log_action(
        self,
        session: Session,
        player_id: int,
        trade_id: int,
        action: str,
        details: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log an audit trail entry."""
        audit_log = AuditLog(
            player_id=player_id,
            trade_id=trade_id,
            action=action,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        session.add(audit_log)


# Global trading system instance
trading_system = TradingSystem()