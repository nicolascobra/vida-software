from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

from app.database import get_db
from app.models.exercicio import Exercicio
from app.schemas.exercicio import ExercicioCreate, ExercicioResponse

router = APIRouter()

@router.post("/", response_model=ExercicioResponse)
def create_exercicio(exercicio: ExercicioCreate, db: Session = Depends(get_db)):
    db_exercicio = Exercicio(**exercicio.model_dump())
    db.add(db_exercicio)
    db.commit()
    db.refresh(db_exercicio)
    return db_exercicio

@router.get("/{user_id}", response_model=List[ExercicioResponse])
def get_exercicios(user_id: str, db: Session = Depends(get_db)):
    return db.query(Exercicio).filter(Exercicio.user_id == user_id).all()

@router.get("/{user_id}/resumo")
def resumo_exercicios(user_id: str, db: Session = Depends(get_db)):
    total = db.query(Exercicio).filter(Exercicio.user_id == user_id).count()
    sete_dias_atras = datetime.now(timezone.utc) - timedelta(days=7)
    recentes = db.query(Exercicio).filter(
        Exercicio.user_id == user_id, 
        Exercicio.data_registro >= sete_dias_atras
    ).count()
    return {"total": total, "media_7dias": recentes / 7.0}
