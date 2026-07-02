from sqlalchemy import Column, Integer, String, Float
from app.db import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)

    density = Column(Float)
    lambda_value = Column(Float)

    co2_factor = Column(Float)
    energy_factor = Column(Float)