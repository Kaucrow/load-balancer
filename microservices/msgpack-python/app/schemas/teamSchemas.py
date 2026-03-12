import uuid
from decimal import Decimal

from pydantic import BaseModel, Field

class TeamBase(BaseModel):
    clubName: str = Field(..., max_length=120)
    foundedYear: int = Field(..., ge=1800)
    championsCount: int = Field(0, ge=0)
    leagueTitlesCount: int = Field(0, ge=0)
    squadValue: Decimal = Field(..., ge=0, decimal_places=2)
    stadiumName: str = Field(..., max_length=120)

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    clubName: str | None = Field(None, max_length=120)
    foundedYear: int | None = Field(None, ge=1800)
    championsCount: int | None = Field(None, ge=0)
    leagueTitlesCount: int | None = Field(None, ge=0)
    squadValue: Decimal | None = Field(None, ge=0, decimal_places=2)
    stadiumName: str | None = Field(None, max_length=120)

class TeamResponse(TeamBase):
    id: uuid.UUID
    model_config = {"from_attributes": True}
