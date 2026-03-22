from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.models.exercicio import Treino, PesoSemanal
from app.schemas.exercicio import (
    TreinoCreate, TreinoResponse,
    PesoSemanalCreate, PesoSemanalResponse,
)

router = APIRouter()


# ── Treinos ──────────────────────────────────────────────

@router.post("/treino", response_model=TreinoResponse)
def registrar_treino(treino: TreinoCreate, db: Session = Depends(get_db)):
    db_treino = Treino(**treino.model_dump())
    db.add(db_treino)
    db.commit()
    db.refresh(db_treino)
    return db_treino


@router.get("/treino/{user_id}", response_model=List[TreinoResponse])
def listar_treinos(
    user_id: str,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Treino).filter(Treino.user_id == user_id)
    if data_inicio:
        q = q.filter(Treino.data >= data_inicio)
    if data_fim:
        q = q.filter(Treino.data <= data_fim)
    return q.order_by(Treino.data.desc()).all()


@router.get("/treino/{user_id}/calendario")
def calendario_on_off(
    user_id: str,
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
):
    """Retorna lista de datas com treino (ON) no período."""
    treinos = (
        db.query(Treino.data)
        .filter(Treino.user_id == user_id, Treino.data >= data_inicio, Treino.data <= data_fim)
        .all()
    )
    dias_on = [str(t.data) for t in treinos]
    return {"data_inicio": str(data_inicio), "data_fim": str(data_fim), "dias_on": dias_on}


# ── Peso Semanal ─────────────────────────────────────────

@router.post("/peso", response_model=PesoSemanalResponse)
def registrar_peso(peso: PesoSemanalCreate, db: Session = Depends(get_db)):
    db_peso = PesoSemanal(**peso.model_dump())
    db.add(db_peso)
    db.commit()
    db.refresh(db_peso)
    return db_peso


@router.get("/peso/{user_id}", response_model=List[PesoSemanalResponse])
def historico_peso(user_id: str, db: Session = Depends(get_db)):
    return (
        db.query(PesoSemanal)
        .filter(PesoSemanal.user_id == user_id)
        .order_by(PesoSemanal.semana_inicio.asc())
        .all()
    )
