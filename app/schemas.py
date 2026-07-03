#Финал
from pydantic import BaseModel, Field
from typing import List, Optional


# === Схема для вывода материала (соответствует контракту) ===
class MaterialOut(BaseModel):
    id: int
    name: str
    density: Optional[float] = None
    lambda_value: Optional[float] = Field(default=None, alias="lambda")
    co2: Optional[float] = Field(default=None, alias="co2_factor")
    energy: Optional[float] = Field(default=None, alias="energy_factor")

    class Config:
        from_attributes = True
        populate_by_name = True


# === Схемы для расчёта стены ===
class LayerInput(BaseModel):
    material_id: int
    thickness: float = Field(..., gt=0, description="Толщина в метрах")


class WallCalculationRequest(BaseModel):
    layers: List[LayerInput] = Field(..., min_items=1)
    armature_mass: float = Field(..., ge=0, description="Масса арматуры на 1 м², кг")
    gsop: float = Field(..., gt=0)
    area: float = Field(..., gt=0)


class LayerDetail(BaseModel):
    material_name: str
    thickness_m: Optional[float] = None
    mass_kg_per_m2: float
    co2_kgCO2_per_m2: float
    energy_MJ_per_m2: float


class Totals(BaseModel):
    mass_total: float
    co2_total: float
    energy_total: float


class Thermal(BaseModel):
    r0: float
    q_per_m2: float
    q_total: float


class Gas(BaseModel):
    v_per_m2: float
    v_total: float


class WallCalculationResponse(BaseModel):
    per_layer: List[LayerDetail]
    totals: Totals
    thermal: Thermal
    gas: Gas
    calculation_version: str = "1.0"