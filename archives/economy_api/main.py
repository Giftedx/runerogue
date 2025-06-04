"""
RuneRogue Economy API Service

This FastAPI application provides the integration layer between the TypeScript game server
and the Python economy models. It exposes REST endpoints for interacting with the economy
system, including player inventories, items, trades, and the Grand Exchange.

As per ADR-001, this service implements the REST API integration approach.
"""

import logging
# AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import os
import time
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import Depends, FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn

# Import the economy models
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = str(Path(__file__).parent.parent.absolute())
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from economy_models.economy import (
    db_manager, Player, Item, InventoryItem, Trade, TradeItem, 
    GrandExchangeOffer, GrandExchangeTransaction, PriceHistory,
    TradeStatus, OfferType, OfferStatus
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.environ.get("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create and configure the FastAPI app
app = FastAPI(
    title="RuneRogue Economy API",
    description="API for the RuneRogue economy system",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OAuth2 with JWT tokens (simplified for demonstration)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Define Pydantic models for API contracts
class PlayerBase(BaseModel):
    username: str
    email: str
    is_active: bool = True

class PlayerCreate(PlayerBase):
    pass

class PlayerResponse(PlayerBase):
    id: int
    created_at: str
    last_login: Optional[str] = None

    class Config:
        orm_mode = True

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_tradeable: bool = True
    is_stackable: bool = False
    base_value: float = 0

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int
    created_at: str

    class Config:
        orm_mode = True

class InventoryItemBase(BaseModel):
    player_id: int
    item_id: int
    quantity: int = 1

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int
    acquired_at: str

    class Config:
        orm_mode = True

# Authentication dependency
async def get_current_player(token: str = Depends(oauth2_scheme)):
    # In a real implementation, validate the JWT token and extract player ID
    # This is simplified for demonstration purposes
    player_id = 1  # Mock player ID
    session = db_manager.get_session()
    player = session.query(Player).filter(Player.id == player_id).first()
    if player is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return player

# Routes
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "RuneRogue Economy API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": int(time.time())}

# Player endpoints
@app.get("/players", response_model=List[PlayerResponse])
async def get_players(
    skip: int = 0, 
    limit: int = 100,
    current_player: Player = Depends(get_current_player)
):
    """Get a list of players."""
    session = db_manager.get_session()
    players = session.query(Player).offset(skip).limit(limit).all()
    return players

@app.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: int,
    current_player: Player = Depends(get_current_player)
):
    """Get a player by ID."""
    session = db_manager.get_session()
    player = session.query(Player).filter(Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@app.post("/players", response_model=PlayerResponse)
async def create_player(
    player: PlayerCreate,
    current_player: Player = Depends(get_current_player)
):
    """Create a new player."""
    session = db_manager.get_session()
    db_player = Player(**player.dict())
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player

# Item endpoints
@app.get("/items", response_model=List[ItemResponse])
async def get_items(
    skip: int = 0, 
    limit: int = 100,
    is_tradeable: Optional[bool] = None,
    name_contains: Optional[str] = None,
    current_player: Player = Depends(get_current_player)
):
    """Get a list of items."""
    session = db_manager.get_session()
    query = session.query(Item)
    
    if is_tradeable is not None:
        query = query.filter(Item.is_tradeable == is_tradeable)
    
    if name_contains:
        query = query.filter(Item.name.like(f"%{name_contains}%"))
    
    items = query.offset(skip).limit(limit).all()
    return items

@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    current_player: Player = Depends(get_current_player)
):
    """Get an item by ID."""
    session = db_manager.get_session()
    item = session.query(Item).filter(Item.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/items", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    current_player: Player = Depends(get_current_player)
):
    """Create a new item."""
    session = db_manager.get_session()
    db_item = Item(**item.dict())
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

# Inventory endpoints
@app.get("/players/{player_id}/inventory", response_model=List[InventoryItemResponse])
async def get_player_inventory(
    player_id: int,
    current_player: Player = Depends(get_current_player)
):
    """Get a player's inventory."""
    session = db_manager.get_session()
    inventory_items = session.query(InventoryItem).filter(InventoryItem.player_id == player_id).all()
    return inventory_items

@app.post("/players/{player_id}/inventory", response_model=InventoryItemResponse)
async def add_inventory_item(
    player_id: int,
    inventory_item: InventoryItemCreate,
    current_player: Player = Depends(get_current_player)
):
    """Add an item to a player's inventory."""
    if inventory_item.player_id != player_id:
        raise HTTPException(
            status_code=400, 
            detail="Player ID in path must match player ID in request body"
        )
    
    session = db_manager.get_session()
    
    # Check if player exists
    player = session.query(Player).filter(Player.id == player_id).first()
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if item exists
    item = session.query(Item).filter(Item.id == inventory_item.item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if the player already has this item in their inventory
    existing_item = session.query(InventoryItem).filter(
        InventoryItem.player_id == player_id,
        InventoryItem.item_id == inventory_item.item_id
    ).first()
    
    if existing_item and not item.is_stackable:
        raise HTTPException(
            status_code=400, 
            detail="Player already has this non-stackable item"
        )
    
    if existing_item and item.is_stackable:
        # Update quantity for stackable items
        existing_item.quantity += inventory_item.quantity
        db_inventory_item = existing_item
    else:
        # Add new inventory item
        db_inventory_item = InventoryItem(**inventory_item.dict())
        session.add(db_inventory_item)
    
    session.commit()
    session.refresh(db_inventory_item)
    return db_inventory_item

# Example trade endpoints (simplified)
@app.get("/trades")
async def get_trades(
    status: Optional[str] = None,
    player_id: Optional[int] = None,
    current_player: Player = Depends(get_current_player)
):
    """Get trades filtered by status and/or player."""
    session = db_manager.get_session()
    query = session.query(Trade)
    
    if status:
        query = query.filter(Trade.status == status)
    
    if player_id:
        query = query.filter(
            (Trade.initiator_id == player_id) | (Trade.receiver_id == player_id)
        )
    
    trades = query.all()
    
    # Convert trades to dictionary for JSON response
    result = []
    for trade in trades:
        trade_dict = {
            "id": trade.id,
            "initiator_id": trade.initiator_id,
            "receiver_id": trade.receiver_id,
            "status": trade.status,
            "initiated_at": trade.initiated_at.isoformat(),
            "completed_at": trade.completed_at.isoformat() if trade.completed_at else None,
            "items": []
        }
        
        # Add trade items
        for item in trade.trade_items:
            trade_dict["items"].append({
                "item_id": item.item_id,
                "quantity": item.quantity,
                "from_player_id": item.from_player_id,
                "to_player_id": item.to_player_id
            })
        
        result.append(trade_dict)
    
    return result

# Add more endpoints for trades, GE offers, price history, etc.

if __name__ == "__main__":
    # Create tables if they don't exist
    db_manager.create_tables()
    
    # Run the FastAPI app
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8001)),
        reload=True
    )
