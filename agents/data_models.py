from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class EnemyConcept(BaseModel):
    """Represents a common enemy concept for a game zone."""
    name: str = Field(..., description="Name of the enemy.")
    combat_level: Optional[int] = Field(None, description="Combat level of the enemy.")
    key_drops_summary: List[str] = Field(default_factory=list, description="Summary of key items the enemy might drop.")
    description: Optional[str] = Field(None, description="Brief description or notable characteristics.")

class WeaponConcept(BaseModel):
    """Represents a basic weapon concept for a game zone."""
    name: str = Field(..., description="Name of the weapon.")
    attack_bonus_summary: Optional[str] = Field(None, description="Summary of its primary attack bonus (e.g., '+5 Slash').")
    found_how_summary: Optional[str] = Field(None, description="Brief summary of how it can be obtained in the zone.")
    description: Optional[str] = Field(None, description="Brief description of the weapon.")

class StartingZoneConcept(BaseModel):
    """
    Represents a structured concept for a game's starting zone,
    populated with data fetched from the OSRS Wiki.
    """
    zone_name: str = Field(..., description="The official name of the zone (e.g., 'Lumbridge').")
    zone_description: str = Field(..., description="A brief, engaging description of the zone.")
    key_locations_summary: List[str] = Field(default_factory=list, description="Notable locations within or near the zone.")
    common_enemy_candidate: Optional[EnemyConcept] = Field(None, description="Details of a common, low-level enemy found in the zone.")
    starter_weapon_candidate: Optional[WeaponConcept] = Field(None, description="Details of a basic weapon obtainable in or near the zone.")
    additional_notes: Optional[str] = Field(None, description="Any other relevant design notes or ideas.")

    def to_json_string(self) -> str:
        """Serializes the model to a JSON string for agent communication."""
        return self.model_dump_json(indent=2)
