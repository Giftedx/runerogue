from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from auth import verify_token

router = APIRouter()


class InventorySyncPayload(BaseModel):
    items: list


@router.post("/players/{player_id}/inventory/sync")
async def sync_inventory(player_id: int, payload: InventorySyncPayload, token_payload: dict = Depends(verify_token)):
    if int(token_payload.get("userId", 0)) != player_id:
        raise HTTPException(status_code=403, detail="Unauthorized inventory update")
    # TODO: Add logic to update inventory in the database
    return {"status": "success", "player_id": player_id}
