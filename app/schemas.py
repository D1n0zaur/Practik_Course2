from pydantic import BaseModel


class MaterialOut(BaseModel):
    id: int
    name: str
    density: float
    lambda_value: float
    co2_factor: float
    energy_factor: float

    class Config:
        from_attributes = True