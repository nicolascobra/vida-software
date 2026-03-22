from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.models.alimentacao import RefeicaoDiaria, ItemRefeicao
from app.schemas.alimentacao import (
    RefeicaoDiariaCreate, RefeicaoDiariaResponse,
    ItemRefeicaoCreate, ItemRefeicaoResponse,
)

router = APIRouter()


# ── Refeição Diária ───────────────────────────────────────

@router.post("/refeicao", response_model=RefeicaoDiariaResponse)
def registrar_refeicao_diaria(refeicao: RefeicaoDiariaCreate, db: Session = Depends(get_db)):
    db_refeicao = RefeicaoDiaria(**refeicao.model_dump())
    db.add(db_refeicao)
    db.commit()
    db.refresh(db_refeicao)
    return db_refeicao


@router.get("/refeicao/{user_id}", response_model=List[RefeicaoDiariaResponse])
def listar_refeicoes_diarias(
    user_id: str,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(RefeicaoDiaria).filter(RefeicaoDiaria.user_id == user_id)
    if data_inicio:
        q = q.filter(RefeicaoDiaria.data >= data_inicio)
    if data_fim:
        q = q.filter(RefeicaoDiaria.data <= data_fim)
    return q.order_by(RefeicaoDiaria.data.desc()).all()


# ── Itens de Refeição ─────────────────────────────────────

@router.post("/item", response_model=ItemRefeicaoResponse)
def adicionar_item(item: ItemRefeicaoCreate, db: Session = Depends(get_db)):
    db_item = ItemRefeicao(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/item/{refeicao_diaria_id}", response_model=List[ItemRefeicaoResponse])
def listar_itens(refeicao_diaria_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ItemRefeicao)
        .filter(ItemRefeicao.refeicao_diaria_id == refeicao_diaria_id)
        .all()
    )


# ── Resumo Diário ─────────────────────────────────────────

@router.get("/resumo/{user_id}/{data}")
def resumo_dia(user_id: str, data: date, db: Session = Depends(get_db)):
    """Calorias totais + macros do dia para o usuário."""
    refeicao = (
        db.query(RefeicaoDiaria)
        .filter(RefeicaoDiaria.user_id == user_id, RefeicaoDiaria.data == data)
        .first()
    )
    if not refeicao:
        return {"data": str(data), "refeicao_registrada": False}

    itens = db.query(ItemRefeicao).filter(ItemRefeicao.refeicao_diaria_id == refeicao.id).all()

    total_calorias = sum(i.calorias for i in itens)
    total_proteinas = sum(i.proteinas_g or 0 for i in itens)
    total_carboidratos = sum(i.carboidratos_g or 0 for i in itens)
    total_gorduras = sum(i.gorduras_g or 0 for i in itens)
    total_peso_g = sum(i.quantidade_g for i in itens)

    return {
        "data": str(data),
        "refeicao_registrada": True,
        "desvio_plano": refeicao.desvio_plano,
        "total_calorias": round(total_calorias, 1),
        "total_peso_g": round(total_peso_g, 1),
        "macros": {
            "proteinas_g": round(total_proteinas, 1),
            "carboidratos_g": round(total_carboidratos, 1),
            "gorduras_g": round(total_gorduras, 1),
        },
        "qtd_itens": len(itens),
    }
