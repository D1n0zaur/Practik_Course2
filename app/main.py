from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db import Base, engine, get_db
from app.models import Material
from app.schemas import MaterialOut, WallCalculationRequest, WallCalculationResponse
from app.services.wall_calculator import calculate_wall

# Создаём таблицы (позже заменим на Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Eco Calculator API",
    version="1.0",
    description="Расчёт теплотехнических и экологических параметров стен"
)


@app.get("/")
def root():
    return {"status": "ok"}


# === Материалы ===
@app.get("/api/v1/materials", response_model=List[MaterialOut])
def get_materials(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Частичное совпадение по названию")
):
    query = db.query(Material)
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))
    return query.all()


@app.get("/api/v1/materials/{material_id}", response_model=MaterialOut)
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


# === Расчёт стены ===
@app.post("/api/v1/walls/calculate", response_model=WallCalculationResponse)
def calculate_wall_endpoint(
    request: WallCalculationRequest,
    db: Session = Depends(get_db)
):
    try:
        result = calculate_wall(
            db=db,
            layers=request.layers,
            armature_mass=request.armature_mass,
            area=request.area,
            gsop=request.gsop
        )
        return WallCalculationResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")