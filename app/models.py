from sqlalchemy import Column, Integer, String, Float, Index
from app.db import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    density = Column(Float, nullable=True)
    lambda_value = Column(Float, nullable=True)
    co2_factor = Column(Float, nullable=True)
    energy_factor = Column(Float, nullable=True)

    __table_args__ = (
        Index("ix_materials_name", "name"),
    )