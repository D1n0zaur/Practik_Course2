from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.templating import Jinja2Templates

from app.db import Base, engine, get_db
from app.models import Material
from app.schemas import MaterialOut, WallCalculationRequest, WallCalculationResponse
from app.services.wall_calculator import calculate_wall

# Создаём таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Eco Calculator API",
    version="1.0",
    description="Расчёт теплотехнических и экологических параметров стен"
)

# CORS (если нужно)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем статику (CSS, JS)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Настраиваем Jinja2
templates = Jinja2Templates(directory="app/templates")


# === Главная страница ===
@app.get("/")
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# === Страница материалов ===
@app.get("/materials")
def materials_list(request: Request, db: Session = Depends(get_db)):
    materials = db.query(Material).order_by(Material.id).all()  # сортировка по ID
    return templates.TemplateResponse("materials.html", {"request": request, "materials": materials})

# === API эндпоинты ===
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