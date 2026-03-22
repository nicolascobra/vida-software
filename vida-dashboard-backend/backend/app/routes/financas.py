from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

from app.database import get_db
from app.models.financas import Financas
from app.schemas.financas import FinancasCreate, FinancasResponse

router = APIRouter()

@router.post("/", response_model=FinancasResponse)
def create_financas(financas: FinancasCreate, db: Session = Depends(get_db)):
    db_financas = Financas(**financas.model_dump())
    db.add(db_financas)
    db.commit()
    db.refresh(db_financas)
    return db_financas

@router.get("/{user_id}", response_model=List[FinancasResponse])
def get_financas(user_id: str, db: Session = Depends(get_db)):
    return db.query(Financas).filter(Financas.user_id == user_id).all()

@router.get("/{user_id}/resumo")
def resumo_financas(user_id: str, db: Session = Depends(get_db)):
    total = db.query(Financas).filter(Financas.user_id == user_id).count()
    sete_dias_atras = datetime.now(timezone.utc) - timedelta(days=7)
    recentes = db.query(Financas).filter(
        Financas.user_id == user_id, 
        Financas.data_registro >= sete_dias_atras
    ).count()
    return {"total": total, "media_7dias": recentes / 7.0}
