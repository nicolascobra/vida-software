from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class CentroCusto(Base):
    __tablename__ = "centros_custo"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    categoria = Column(String, nullable=False)  # ex: alimentacao, transporte, lazer, saude
    limite_mensal = Column(Float, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data = Column(Date, nullable=False)
    # entrada | saida
    tipo = Column(String, nullable=False)
    valor = Column(Float, nullable=False)
    categoria = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
    tipo_pagamento = Column(String, server_default="pix", nullable=True)
    # fixo | variavel
    custo_fixo = Column(Boolean, default=False, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class ConfiguracaoFinanceira(Base):
    __tablename__ = "configuracao_financeira"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    renda_mensal = Column(Float, nullable=False)
    mes_referencia = Column(Date, nullable=False)  # sempre o dia 01 do mês
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
