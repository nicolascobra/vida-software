from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

from app.database import get_db
from app.models.alimentacao import Alimentacao
from app.schemas.alimentacao import AlimentacaoCreate, AlimentacaoResponse

router = APIRouter()

@router.post("/", response_model=AlimentacaoResponse)
def create_alimentacao(alimentacao: AlimentacaoCreate, db: Session = Depends(get_db)):
    db_alimentacao = Alimentacao(**alimentacao.model_dump())
    db.add(db_alimentacao)
    db.commit()
    db.refresh(db_alimentacao)
    return db_alimentacao

@router.get("/{user_id}", response_model=List[AlimentacaoResponse])
def get_alimentacoes(user_id: str, db: Session = Depends(get_db)):
    return db.query(Alimentacao).filter(Alimentacao.user_id == user_id).all()

@router.get("/{user_id}/resumo")
def resumo_alimentacao(user_id: str, db: Session = Depends(get_db)):
    total = db.query(Alimentacao).filter(Alimentacao.user_id == user_id).count()
    sete_dias_atras = datetime.now(timezone.utc) - timedelta(days=7)
    recentes = db.query(Alimentacao).filter(
        Alimentacao.user_id == user_id, 
        Alimentacao.data_registro >= sete_dias_atras
    ).count()
    return {"total": total, "media_7dias": recentes / 7.0}
