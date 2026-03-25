from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class TabelaNutricional(Base):
    __tablename__ = "tabela_nutricional"

    id               = Column(Integer, primary_key=True, index=True)
    alimento         = Column(String, nullable=False)
    descricao_unidade = Column(String, nullable=False, default="1 unidade")
    kcal             = Column(Float, nullable=False, default=0)
    proteina         = Column(Float, nullable=False, default=0)
    carboidrato      = Column(Float, nullable=False, default=0)
    gordura          = Column(Float, nullable=False, default=0)
    criado_em        = Column(DateTime(timezone=True), server_default=func.now())


class RefeicaoDiaria(Base):
    __tablename__ = "refeicoes_diarias"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data = Column(Date, nullable=False)
    desvio_plano = Column(Boolean, default=False, nullable=False)
    observacoes_desvio = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class ItemRefeicao(Base):
    __tablename__ = "itens_refeicao"

    id                    = Column(Integer, primary_key=True, index=True)
    refeicao_diaria_id    = Column(Integer, ForeignKey("refeicoes_diarias.id"), nullable=False, index=True)
    tipo_refeicao         = Column(String, nullable=False)
    alimento              = Column(String, nullable=False)
    quantidade_g          = Column(Float, nullable=True, default=0)
    # nova referência à tabela dimensional
    tabela_nutricional_id = Column(Integer, ForeignKey("tabela_nutricional.id"), nullable=True)
    quantidade            = Column(Float, nullable=True, default=1)
    calorias              = Column(Float, nullable=False)
    proteinas_g           = Column(Float, nullable=True)
    carboidratos_g        = Column(Float, nullable=True)
    gorduras_g            = Column(Float, nullable=True)
    criado_em             = Column(DateTime(timezone=True), server_default=func.now())
