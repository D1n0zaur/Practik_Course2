# 🧱 ECO — Eco Construction Calculator

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Enabled-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📌 О проекте

ECO — учебное веб-приложение для расчёта теплотехнических и экологических параметров ограждающих конструкций.

Проект выполнен в рамках учебной практики (2 курс, ИВТ).

Он позволяет рассчитывать:
- сопротивление теплопередаче (R₀)
- теплопотери здания
- CO₂-эквивалент материалов
- энергозатраты
- многослойные конструкции стен

## ⚙️ Возможности

- Расчёт многослойных стен
- Подбор материалов из базы данных
- Учёт толщины каждого слоя
- Учёт арматуры
- REST API
- Web-интерфейс (Bootstrap + JS)
- Fallback-режим (мок-расчёт)

## 🧠 Архитектура проекта

app/
├── main.py              # FastAPI entrypoint
├── models.py           # SQLAlchemy модели
├── schemas.py          # Pydantic схемы
├── db.py               # подключение к PostgreSQL
├── services/
│   └── wall_calculator.py
├── templates/          # HTML (Jinja2)
├── static/             # CSS / JS

## 🚀 Запуск проекта

### 1. Клонирование
git clone https://github.com/D1n0zaur/Practik_Course2.git  
cd Practik_Course2  

### 2. Виртуальное окружение
python -m venv venv  
source venv/bin/activate (Linux/Mac)  
venv\Scripts\activate (Windows)

### 3. Установка зависимостей
pip install -r requirements.txt

### 4. Настройка .env
DB_USER=postgres  
DB_PASSWORD=your_password  
DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=eco_db  

### 5. Запуск сервера
uvicorn app.main:app --reload  

## 🌐 Интерфейс

http://127.0.0.1:8000

## 📡 API

GET /api/v1/materials  
POST /api/v1/walls/calculate  

Пример запроса:
{
  "layers": [
    { "material_id": 1, "thickness": 0.2 },
    { "material_id": 2, "thickness": 0.1 }
  ],
  "armature_mass": 1.5,
  "gsop": 4378,
  "area": 620
}

## 🧩 Особенности реализации

- Чистая архитектура (API / Service / DB)
- SQLAlchemy ORM
- Pydantic валидация
- Инженерная расчётная модель
- Mock fallback при ошибках БД

## 🛠 Технологии

Python 3.10+  
FastAPI  
PostgreSQL  
SQLAlchemy  
Pydantic  
Jinja2  
Bootstrap 5  
Vanilla JS  

## 📄 Лицензия

MIT License

## 🎓 Статус

Учебный проект (2 курс)  
Демонстрация backend-навыков

## 👤 Автор

GitHub: https://github.com/D1n0zaur
GitHub: https://github.com/9DeadNess9
GitHub: https://github.com/HD232