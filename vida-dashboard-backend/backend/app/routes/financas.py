from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from app.database import get_db
from app.models.financas import CentroCusto, Transacao, ConfiguracaoFinanceira
from app.schemas.financas import (
    CentroCustoCreate, CentroCustoResponse,
    TransacaoCreate, TransacaoResponse,
    ConfiguracaoFinanceiraCreate, ConfiguracaoFinanceiraResponse,
)

router = APIRouter()


# ── Centros de Custo (configuração) ──────────────────────

@router.post("/configuracao", response_model=CentroCustoResponse)
def criar_centro_custo(centro: CentroCustoCreate, db: Session = Depends(get_db)):
    db_centro = CentroCusto(**centro.model_dump())
    db.add(db_centro)
    db.commit()
    db.refresh(db_centro)
    return db_centro


@router.get("/configuracao/{user_id}", response_model=List[CentroCustoResponse])
def listar_centros_custo(user_id: str, db: Session = Depends(get_db)):
    return db.query(CentroCusto).filter(CentroCusto.user_id == user_id).all()


@router.put("/configuracao/{centro_id}", response_model=CentroCustoResponse)
def atualizar_centro_custo(
    centro_id: int, centro: CentroCustoCreate, db: Session = Depends(get_db)
):
    db_centro = db.query(CentroCusto).filter(CentroCusto.id == centro_id).first()
    if not db_centro:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Centro de custo não encontrado")
    for campo, valor in centro.model_dump().items():
        setattr(db_centro, campo, valor)
    db.commit()
    db.refresh(db_centro)
    return db_centro


# ── Transações ────────────────────────────────────────────

@router.post("/transacao", response_model=TransacaoResponse)
def registrar_transacao(transacao: TransacaoCreate, db: Session = Depends(get_db)):
    db_transacao = Transacao(**transacao.model_dump())
    db.add(db_transacao)
    db.commit()
    db.refresh(db_transacao)
    return db_transacao


@router.get("/transacao/{user_id}", response_model=List[TransacaoResponse])
def listar_transacoes(
    user_id: str,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    tipo: Optional[str] = Query(None),
    custo_fixo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Transacao).filter(Transacao.user_id == user_id)
    if data_inicio:
        q = q.filter(Transacao.data >= data_inicio)
    if data_fim:
        q = q.filter(Transacao.data <= data_fim)
    if tipo:
        q = q.filter(Transacao.tipo == tipo)
    if custo_fixo is not None:
        q = q.filter(Transacao.custo_fixo == custo_fixo)
    return q.order_by(Transacao.data.desc()).all()


# ── Configuração Financeira (renda mensal) ────────────────

@router.post("/renda", response_model=ConfiguracaoFinanceiraResponse)
def configurar_renda(config: ConfiguracaoFinanceiraCreate, db: Session = Depends(get_db)):
    db_config = ConfiguracaoFinanceira(**config.model_dump())
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.get("/renda/{user_id}", response_model=List[ConfiguracaoFinanceiraResponse])
def listar_renda(user_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ConfiguracaoFinanceira)
        .filter(ConfiguracaoFinanceira.user_id == user_id)
        .order_by(ConfiguracaoFinanceira.mes_referencia.desc())
        .all()
    )


# ── Resumo Mensal por Categoria ───────────────────────────

@router.get("/resumo/{user_id}")
def resumo_mensal(
    user_id: str,
    ano: int = Query(...),
    mes: int = Query(...),
    db: Session = Depends(get_db),
):
    """Retorna realizado vs limite por categoria no mês."""
    transacoes = (
        db.query(Transacao)
        .filter(
            Transacao.user_id == user_id,
            extract("year", Transacao.data) == ano,
            extract("month", Transacao.data) == mes,
        )
        .all()
    )

    centros = db.query(CentroCusto).filter(CentroCusto.user_id == user_id).all()
    limites = {c.categoria: c.limite_mensal for c in centros}

    total_entradas = sum(t.valor for t in transacoes if t.tipo == "entrada")
    total_saidas = sum(t.valor for t in transacoes if t.tipo == "saida")

    por_categoria: dict = {}
    for t in transacoes:
        if t.tipo == "saida":
            por_categoria.setdefault(t.categoria, 0)
            por_categoria[t.categoria] += t.valor

    categorias_detalhadas = [
        {
            "categoria": cat,
            "realizado": round(valor, 2),
            "limite_mensal": limites.get(cat),
            "percentual": round(valor / limites[cat] * 100, 1) if limites.get(cat) else None,
        }
        for cat, valor in por_categoria.items()
    ]

    return {
        "ano": ano,
        "mes": mes,
        "total_entradas": round(total_entradas, 2),
        "total_saidas": round(total_saidas, 2),
        "saldo": round(total_entradas - total_saidas, 2),
        "por_categoria": categorias_detalhadas,
    }
