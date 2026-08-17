import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# 1. Configuración de la Base de Datos (Supabase / PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No se encontró la variable de entorno DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Definición de Modelos SQLAlchemy (Estructura de la BD)
class ProyectoDB(Base):
    __tablename__ = "proyectos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    objetivos = relationship("ObjetivoDB", back_populates="proyecto", cascade="all, delete-orphan")

class ObjetivoDB(Base):
    __tablename__ = "objetivos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id"), nullable=False)
    proyecto = relationship("ProyectoDB", back_populates="objetivos")
    indicadores = relationship("IndicadorDB", back_populates="objetivo", cascade="all, delete-orphan")

class IndicadorDB(Base):
    __tablename__ = "indicadores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    linea_base = Column(Float, default=0.0)
    meta_final = Column(Float, default=0.0)
    objetivo_id = Column(Integer, ForeignKey("objetivos.id"), nullable=False)
    objetivo = relationship("ObjetivoDB", back_populates="indicadores")
    actividades = relationship("ActividadDB", back_populates="indicador", cascade="all, delete-orphan")

class ActividadDB(Base):
    __tablename__ = "actividades"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    estado = Column(String, default="Pendiente")
    porcentaje_avance = Column(Float, default=0.0)
    indicador_id = Column(Integer, ForeignKey("indicadores.id"), nullable=False)
    indicador = relationship("IndicadorDB", back_populates="actividades")

# 3. Inicialización de la Aplicación FastAPI
app = FastAPI(
    title="Sistema CARI - Monitoreo y Evaluación",
    version="1.0.0"
)

# Configuración de CORS para permitir peticiones frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Evento de inicio: Crea las tablas limpias en Supabase si no existen
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# Dependencia para obtener la sesión de base de datos por petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Esquemas Pydantic para validación de datos (Schemas)
class ProyectoCreate(BaseModel):
    nombre: str

class ProyectoResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

# 5. Rutas de ejemplo básicas de la API
@app.get("/")
def read_root():
    return FileResponse("index.html")

@app.post("/proyectos/", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(proyecto: ProyectoCreate, db: Session = Depends(get_db)):
    nuevo_proyecto = ProyectoDB(nombre=proyecto.nombre)
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(nuevo_proyecto)
    return nuevo_proyecto

@app.get("/proyectos/", response_model=List[ProyectoResponse])
def listar_proyectos(db: Session = Depends(get_db)):
    return db.query(ProyectoDB).all()
