from fastapi import FastAPI
from app.db import Base, engine

app = FastAPI(
    title="Eco Calculator API",
    version="1.0"
)

# создаём таблицы при старте
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"status": "ok"}