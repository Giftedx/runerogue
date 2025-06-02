"""
Grand Exchange System

Automated marketplace for buying and selling items with order matching,
price discovery, and market analytics.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from economy_models.economy import (
    db_manager,
    Player,
    Item,
    InventoryItem,
    GrandExchangeOffer,
    GrandExchangeTransaction,
    PriceHistory,
    OfferType,
    OfferStatus,
    AuditLog,
)

logger = logging.getLogger(__name__)


class GrandExchangeError(Exception):
    """Base exception for Grand Exchange operations."""
    pass


class InsufficientFundsError(GrandExchangeError):
    """Raised when player doesn't have enough funds for purchase."""
    pass


class InvalidOfferError(GrandExchangeError):
    """Raised when offer is invalid."""
    pass


class GrandExchangeSystem:
    """Grand Exchange automated marketplace."""

    def __init__(self):
        self.db = db_manager
        self.max_offer_duration = timedelta(hours=48)  # Offers expire in 48h

    def place_buy_offer(
        self,
        player_id: int,
        item_id: int,
        quantity: int,
        price_per_item: Decimal
    ) -> Dict:
        """
        Place a buy offer on the Grand Exchange.

        Args:
            player_id: ID of the buying player
            item_id: ID of the item to buy
            quantity: Quantity to buy
            price_per_item: Maximum price per item

        Returns:
            Dict containing offer information

        Raises:
            InvalidOfferError: If offer is invalid
            InsufficientFundsError: If player cannot afford the offer
        """
        return self._place_offer(
            player_id=player_id,
            item_id=item_id,
            quantity=quantity,
            price_per_item=price_per_item,
            offer_type=OfferType.BUY
        )

    def place_sell_offer(
        self,
        player_id: int,
        item_id: int,
        quantity: int,
        price_per_item: Decimal
    ) -> Dict:
        """
        Place a sell offer on the Grand Exchange.

        Args:
            player_id: ID of the selling player
            item_id: ID of the item to sell
            quantity: Quantity to sell
            price_per_item: Minimum price per item

        Returns:
            Dict containing offer information

        Raises:
            InvalidOfferError: If offer is invalid
        """
        return self._place_offer(
            player_id=player_id,
            item_id=item_id,
            quantity=quantity,
            price_per_item=price_per_item,
            offer_type=OfferType.SELL
        )

    def _place_offer(
        self,
        player_id: int,
        item_id: int,
        quantity: int,
        price_per_item: Decimal,
        offer_type: OfferType
    ) -> Dict:
        """Internal method to place an offer."""
        if quantity <= 0:
            raise InvalidOfferError("Quantity must be positive")

        if price_per_item <= 0:
            raise InvalidOfferError("Price must be positive")

        session = self.db.get_session()
        try:
            # Verify player exists and is active
            player = session.query(Player).filter(
                Player.id == player_id,
                Player.is_active
            ).first()

            if not player:
                raise InvalidOfferError("Player not found or inactive")

            # Verify item exists and is tradeable
            item = session.query(Item).filter(
                Item.id == item_id,
                Item.is_tradeable
            ).first()

            if not item:
                raise InvalidOfferError("Item not found or not tradeable")

            # Additional validation based on offer type
            if offer_type == OfferType.SELL:
                # Check player has sufficient items
                inventory_item = session.query(InventoryItem).filter(
                    InventoryItem.player_id == player_id,
                    InventoryItem.item_id == item_id
                ).first()

                if not inventory_item or inventory_item.quantity < quantity:
                    raise InvalidOfferError(
                        f"Insufficient {item.name} to sell "
                        f"(need {quantity}, have "
                        f"{inventory_item.quantity if inventory_item else 0})"
                    )

            # Create the offer
            expires_at = datetime.utcnow() + self.max_offer_duration
            offer = GrandExchangeOffer(
                player_id=player_id,
                item_id=item_id,
                offer_type=offer_type.value,
                quantity=quantity,
                price_per_item=price_per_item,
                quantity_remaining=quantity,
                expires_at=expires_at
            )

            session.add(offer)
            session.flush()  # Get the offer ID

            # Note: For sell offers, we validate inventory but don't reserve
            # items upfront. Items will be taken during actual transactions.

            session.commit()

            # Try to match with existing offers
            self._process_offer_matching(offer.id)

            # Log the action
            self._log_action(
                session,
                player_id=player_id,
                action="ge_offer_placed",
                details=f"Placed {offer_type.value} offer for "
                       f"{quantity} {item.name} at {price_per_item} each"
            )

            logger.info(
                f"Player {player_id} placed {offer_type.value} "
                f"offer {offer.id} for {quantity} {item.name}"
            )

            return {
                "offer_id": offer.id,
                "status": offer.status,
                "offer_type": offer.offer_type,
                "item_name": item.name,
                "quantity": offer.quantity,
                "quantity_remaining": offer.quantity_remaining,
                "price_per_item": float(offer.price_per_item),
                "total_value": float(offer.price_per_item * offer.quantity),
                "created_at": offer.created_at.isoformat(),
                "expires_at": offer.expires_at.isoformat()
            }

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error placing offer: {e}")
            raise GrandExchangeError("Failed to place offer")
        finally:
            session.close()

    def _process_offer_matching(self, new_offer_id: int):
        """Process matching for a new offer."""
        session = self.db.get_session()
        try:
            new_offer = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.id == new_offer_id,
                GrandExchangeOffer.status == OfferStatus.ACTIVE.value
            ).first()

            if not new_offer:
                return

            # Find compatible offers
            if new_offer.offer_type == OfferType.BUY.value:
                # Match with sell offers
                compatible_offers = session.query(GrandExchangeOffer).filter(
                    GrandExchangeOffer.item_id == new_offer.item_id,
                    GrandExchangeOffer.offer_type == OfferType.SELL.value,
                    GrandExchangeOffer.status == OfferStatus.ACTIVE.value,
                    GrandExchangeOffer.price_per_item <=
                    new_offer.price_per_item,
                    GrandExchangeOffer.player_id != new_offer.player_id
                ).order_by(
                    GrandExchangeOffer.price_per_item.asc(),
                    GrandExchangeOffer.created_at.asc()
                ).all()
            else:
                # Match with buy offers
                compatible_offers = session.query(GrandExchangeOffer).filter(
                    GrandExchangeOffer.item_id == new_offer.item_id,
                    GrandExchangeOffer.offer_type == OfferType.BUY.value,
                    GrandExchangeOffer.status == OfferStatus.ACTIVE.value,
                    GrandExchangeOffer.price_per_item >=
                    new_offer.price_per_item,
                    GrandExchangeOffer.player_id != new_offer.player_id
                ).order_by(
                    GrandExchangeOffer.price_per_item.desc(),
                    GrandExchangeOffer.created_at.asc()
                ).all()

            # Process matches
            for compatible_offer in compatible_offers:
                if new_offer.quantity_remaining <= 0:
                    break

                # Determine transaction details
                transaction_quantity = min(
                    new_offer.quantity_remaining,
                    compatible_offer.quantity_remaining
                )

                # Use the price of the older offer (price-time priority)
                transaction_price = compatible_offer.price_per_item

                # Determine buyer and seller
                if new_offer.offer_type == OfferType.BUY.value:
                    buyer_id = new_offer.player_id
                    seller_id = compatible_offer.player_id
                    buy_offer = new_offer
                    sell_offer = compatible_offer
                else:
                    buyer_id = compatible_offer.player_id
                    seller_id = new_offer.player_id
                    buy_offer = compatible_offer
                    sell_offer = new_offer

                # Execute the transaction
                self._execute_transaction(
                    session,
                    buy_offer=buy_offer,
                    sell_offer=sell_offer,
                    buyer_id=buyer_id,
                    seller_id=seller_id,
                    item_id=new_offer.item_id,
                    quantity=transaction_quantity,
                    price_per_item=transaction_price
                )

                # Update offer quantities
                new_offer.quantity_remaining -= transaction_quantity
                compatible_offer.quantity_remaining -= transaction_quantity

                # Mark completed offers
                if new_offer.quantity_remaining <= 0:
                    new_offer.status = OfferStatus.COMPLETED.value
                    new_offer.completed_at = datetime.utcnow()

                if compatible_offer.quantity_remaining <= 0:
                    compatible_offer.status = OfferStatus.COMPLETED.value
                    compatible_offer.completed_at = datetime.utcnow()

                # Record price history
                self._record_price_history(
                    session,
                    item_id=new_offer.item_id,
                    price=transaction_price,
                    volume=transaction_quantity
                )

            session.commit()

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error processing offer matching: {e}")
        finally:
            session.close()

    def _execute_transaction(
        self,
        session: Session,
        buy_offer: GrandExchangeOffer,
        sell_offer: GrandExchangeOffer,
        buyer_id: int,
        seller_id: int,
        item_id: int,
        quantity: int,
        price_per_item: Decimal
    ):
        """Execute a matched transaction."""
        total_price = price_per_item * quantity

        # Transfer items from seller to buyer
        # Remove items from seller's inventory
        seller_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == seller_id,
            InventoryItem.item_id == item_id
        ).first()

        if seller_inventory:
            seller_inventory.quantity -= quantity
            if seller_inventory.quantity <= 0:
                session.delete(seller_inventory)

        # Add items to buyer
        buyer_inventory = session.query(InventoryItem).filter(
            InventoryItem.player_id == buyer_id,
            InventoryItem.item_id == item_id
        ).first()

        if buyer_inventory:
            buyer_inventory.quantity += quantity
        else:
            buyer_inventory = InventoryItem(
                player_id=buyer_id,
                item_id=item_id,
                quantity=quantity
            )
            session.add(buyer_inventory)

        # Record the transaction
        transaction = GrandExchangeTransaction(
            offer_id=buy_offer.id,  # Link to buy offer by convention
            buyer_id=buyer_id,
            seller_id=seller_id,
            item_id=item_id,
            quantity=quantity,
            price_per_item=price_per_item,
            total_price=total_price
        )

        session.add(transaction)

        logger.info(
            f"GE transaction: {quantity} items from player "
            f"{seller_id} to player {buyer_id} at "
            f"{price_per_item} each"
        )

    def cancel_offer(self, offer_id: int, player_id: int) -> Dict:
        """Cancel an active offer."""
        session = self.db.get_session()
        try:
            offer = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.id == offer_id,
                GrandExchangeOffer.player_id == player_id,
                GrandExchangeOffer.status == OfferStatus.ACTIVE.value
            ).first()

            if not offer:
                raise InvalidOfferError(
                    "Offer not found or cannot be cancelled"
                )

            offer.status = OfferStatus.CANCELLED.value
            offer.completed_at = datetime.utcnow()

            # Note: No need to return items since we don't pre-reserve
            # for sell offers anymore

            session.commit()

            # Log the action
            self._log_action(
                session,
                player_id=player_id,
                action="ge_offer_cancelled",
                details=f"Cancelled offer {offer_id}"
            )

            logger.info(f"Player {player_id} cancelled offer {offer_id}")

            return {
                "offer_id": offer_id,
                "status": "cancelled",
                "message": "Offer cancelled successfully"
            }

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Database error cancelling offer: {e}")
            raise GrandExchangeError("Failed to cancel offer")
        finally:
            session.close()

    def get_player_offers(
        self,
        player_id: int,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get all offers for a player."""
        session = self.db.get_session()
        try:
            query = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.player_id == player_id
            )

            if status:
                query = query.filter(GrandExchangeOffer.status == status)

            offers = query.order_by(
                GrandExchangeOffer.created_at.desc()
            ).all()

            offers_data = []
            for offer in offers:
                offers_data.append({
                    "offer_id": offer.id,
                    "item_name": offer.item.name,
                    "offer_type": offer.offer_type,
                    "quantity": offer.quantity,
                    "quantity_remaining": offer.quantity_remaining,
                    "price_per_item": float(offer.price_per_item),
                    "status": offer.status,
                    "created_at": offer.created_at.isoformat(),
                    "expires_at": (
                        offer.expires_at.isoformat()
                        if offer.expires_at else None
                    )
                })

            return offers_data

        finally:
            session.close()

    def get_item_market_data(self, item_id: int) -> Dict:
        """Get market data for an item."""
        session = self.db.get_session()
        try:
            item = session.query(Item).filter(
                Item.id == item_id
            ).first()

            if not item:
                raise InvalidOfferError("Item not found")

            # Get current active offers
            buy_offers = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.item_id == item_id,
                GrandExchangeOffer.offer_type == OfferType.BUY.value,
                GrandExchangeOffer.status == OfferStatus.ACTIVE.value
            ).order_by(
                GrandExchangeOffer.price_per_item.desc()
            ).limit(5).all()

            sell_offers = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.item_id == item_id,
                GrandExchangeOffer.offer_type == OfferType.SELL.value,
                GrandExchangeOffer.status == OfferStatus.ACTIVE.value
            ).order_by(
                GrandExchangeOffer.price_per_item.asc()
            ).limit(5).all()

            # Get recent price history
            recent_prices = session.query(PriceHistory).filter(
                PriceHistory.item_id == item_id,
                PriceHistory.recorded_at >=
                datetime.utcnow() - timedelta(days=7)
            ).order_by(PriceHistory.recorded_at.desc()).limit(100).all()

            # Calculate statistics
            if recent_prices:
                latest_price = recent_prices[0].price
                avg_price = sum(p.price for p in recent_prices) / len(
                    recent_prices
                )
                total_volume = sum(p.volume for p in recent_prices)
            else:
                latest_price = avg_price = total_volume = 0

            return {
                "item_id": item_id,
                "item_name": item.name,
                "latest_price": float(latest_price),
                "average_price": float(avg_price),
                "total_volume": total_volume,
                "highest_buy_offer": (
                    float(buy_offers[0].price_per_item)
                    if buy_offers else None
                ),
                "lowest_sell_offer": (
                    float(sell_offers[0].price_per_item)
                    if sell_offers else None
                ),
                "buy_offers": [
                    {
                        "price": float(offer.price_per_item),
                        "quantity": offer.quantity_remaining
                    }
                    for offer in buy_offers
                ],
                "sell_offers": [
                    {
                        "price": float(offer.price_per_item),
                        "quantity": offer.quantity_remaining
                    }
                    for offer in sell_offers
                ]
            }

        finally:
            session.close()

    def get_price_history(
        self,
        item_id: int,
        days: int = 30
    ) -> List[Dict]:
        """Get price history for an item."""
        session = self.db.get_session()
        try:
            since_date = datetime.utcnow() - timedelta(days=days)

            price_data = session.query(PriceHistory).filter(
                PriceHistory.item_id == item_id,
                PriceHistory.recorded_at >= since_date
            ).order_by(PriceHistory.recorded_at.asc()).all()

            return [
                {
                    "price": float(entry.price),
                    "volume": entry.volume,
                    "recorded_at": entry.recorded_at.isoformat()
                }
                for entry in price_data
            ]

        finally:
            session.close()

    def expire_old_offers(self):
        """Expire old offers (should be run periodically)."""
        session = self.db.get_session()
        try:
            expired_offers = session.query(GrandExchangeOffer).filter(
                GrandExchangeOffer.status == OfferStatus.ACTIVE.value,
                GrandExchangeOffer.expires_at <= datetime.utcnow()
            ).all()

            for offer in expired_offers:
                offer.status = OfferStatus.EXPIRED.value
                offer.completed_at = datetime.utcnow()

                # Note: No need to return items since we don't pre-reserve
                # for sell offers anymore

                logger.info(f"Expired offer {offer.id}")

            session.commit()
            return len(expired_offers)

        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error expiring offers: {e}")
            return 0
        finally:
            session.close()

    def _record_price_history(
        self,
        session: Session,
        item_id: int,
        price: Decimal,
        volume: int
    ):
        """Record a price point in history."""
        price_entry = PriceHistory(
            item_id=item_id,
            price=price,
            volume=volume,
            source="ge"
        )
        session.add(price_entry)

    def _log_action(
        self,
        session: Session,
        player_id: int,
        action: str,
        details: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log an audit trail entry."""
        audit_log = AuditLog(
            player_id=player_id,
            action=action,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        session.add(audit_log)


# Global Grand Exchange system instance
grand_exchange = GrandExchangeSystem()
