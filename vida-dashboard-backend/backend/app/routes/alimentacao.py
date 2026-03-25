from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.alimentacao import RefeicaoDiaria, ItemRefeicao, TabelaNutricional
from app.schemas.alimentacao import (
    RefeicaoDiariaCreate, RefeicaoDiariaResponse,
    ItemRefeicaoCreate, ItemRefeicaoResponse,
    TabelaNutricionalCreate, TabelaNutricionalResponse,
    RefeicaoCompletaCreate,
)


class RefeicaoItemCreate(BaseModel):
    user_id: str
    data: date
    tipo: str
    descricao: str
    calorias: float = 0
    proteinas: float = 0
    carboidratos: float = 0
    gorduras: float = 0

router = APIRouter()


# ── Tabela Nutricional (dimensão) ──────────────────────────────

@router.get("/tabela-nutricional", response_model=List[TabelaNutricionalResponse])
def listar_tabela_nutricional(db: Session = Depends(get_db)):
    return db.query(TabelaNutricional).order_by(TabelaNutricional.alimento).all()


@router.post("/tabela-nutricional", response_model=TabelaNutricionalResponse)
def criar_alimento_nutricional(payload: TabelaNutricionalCreate, db: Session = Depends(get_db)):
    item = TabelaNutricional(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ── Refeição Diária ───────────────────────────────────────────

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


# ── Itens de Refeição ─────────────────────────────────────────

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


# ── Itens planos por usuário (frontend-friendly) ──────────────

@router.get("/itens-usuario/{user_id}")
def listar_itens_usuario(
    user_id: str,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(ItemRefeicao, RefeicaoDiaria.data)
        .join(RefeicaoDiaria, ItemRefeicao.refeicao_diaria_id == RefeicaoDiaria.id)
        .filter(RefeicaoDiaria.user_id == user_id)
    )
    if data_inicio:
        q = q.filter(RefeicaoDiaria.data >= data_inicio)
    if data_fim:
        q = q.filter(RefeicaoDiaria.data <= data_fim)

    rows = q.all()
    return [
        {
            "id":           item.id,
            "data":         str(ref_data),
            "tipo":         item.tipo_refeicao,
            "descricao":    item.alimento,
            "calorias":     item.calorias,
            "proteinas":    item.proteinas_g    or 0,
            "carboidratos": item.carboidratos_g or 0,
            "gorduras":     item.gorduras_g     or 0,
        }
        for item, ref_data in rows
    ]


# ── Registro legado (compat) ──────────────────────────────────

@router.post("/refeicao-item")
def registrar_refeicao_item(payload: RefeicaoItemCreate, db: Session = Depends(get_db)):
    refeicao_dia = (
        db.query(RefeicaoDiaria)
        .filter(RefeicaoDiaria.user_id == payload.user_id, RefeicaoDiaria.data == payload.data)
        .first()
    )
    if not refeicao_dia:
        refeicao_dia = RefeicaoDiaria(user_id=payload.user_id, data=payload.data)
        db.add(refeicao_dia)
        db.flush()

    item = ItemRefeicao(
        refeicao_diaria_id=refeicao_dia.id,
        tipo_refeicao=payload.tipo,
        alimento=payload.descricao,
        quantidade_g=0,
        calorias=payload.calorias,
        proteinas_g=payload.proteinas,
        carboidratos_g=payload.carboidratos,
        gorduras_g=payload.gorduras,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id, "data": str(payload.data), "tipo": payload.tipo,
        "descricao": payload.descricao, "calorias": payload.calorias,
        "proteinas": payload.proteinas, "carboidratos": payload.carboidratos, "gorduras": payload.gorduras,
    }


# ── Registro completo (novo fluxo) ────────────────────────────

@router.post("/refeicao-completa")
def registrar_refeicao_completa(payload: RefeicaoCompletaCreate, db: Session = Depends(get_db)):
    """Cria/reutiliza o registro diário e adiciona múltiplos itens de uma vez."""
    refeicao_dia = (
        db.query(RefeicaoDiaria)
        .filter(RefeicaoDiaria.user_id == payload.user_id, RefeicaoDiaria.data == payload.data)
        .first()
    )
    if not refeicao_dia:
        refeicao_dia = RefeicaoDiaria(user_id=payload.user_id, data=payload.data)
        db.add(refeicao_dia)
        db.flush()

    criados = []
    for it in payload.itens:
        item = ItemRefeicao(
            refeicao_diaria_id=refeicao_dia.id,
            tipo_refeicao=payload.tipo,
            alimento=it.alimento,
            quantidade_g=0,
            tabela_nutricional_id=it.tabela_nutricional_id,
            quantidade=it.quantidade,
            calorias=it.calorias,
            proteinas_g=it.proteinas,
            carboidratos_g=it.carboidratos,
            gorduras_g=it.gorduras,
        )
        db.add(item)
        criados.append(item)

    db.commit()
    for it in criados:
        db.refresh(it)

    return {
        "data": str(payload.data),
        "tipo": payload.tipo,
        "itens_criados": len(criados),
        "itens": [
            {
                "id": it.id, "alimento": it.alimento, "quantidade": it.quantidade,
                "calorias": it.calorias, "proteinas": it.proteinas_g,
                "carboidratos": it.carboidratos_g, "gorduras": it.gorduras_g,
            }
            for it in criados
        ],
    }


# ── Resumo Diário ─────────────────────────────────────────────

@router.get("/resumo/{user_id}/{data}")
def resumo_dia(user_id: str, data: date, db: Session = Depends(get_db)):
    refeicao = (
        db.query(RefeicaoDiaria)
        .filter(RefeicaoDiaria.user_id == user_id, RefeicaoDiaria.data == data)
        .first()
    )
    if not refeicao:
        return {"data": str(data), "refeicao_registrada": False}

    itens = db.query(ItemRefeicao).filter(ItemRefeicao.refeicao_diaria_id == refeicao.id).all()
    return {
        "data": str(data),
        "refeicao_registrada": True,
        "desvio_plano": refeicao.desvio_plano,
        "total_calorias":    round(sum(i.calorias            for i in itens), 1),
        "total_peso_g":      round(sum(i.quantidade_g or 0   for i in itens), 1),
        "macros": {
            "proteinas_g":    round(sum(i.proteinas_g    or 0 for i in itens), 1),
            "carboidratos_g": round(sum(i.carboidratos_g or 0 for i in itens), 1),
            "gorduras_g":     round(sum(i.gorduras_g     or 0 for i in itens), 1),
        },
        "qtd_itens": len(itens),
    }
