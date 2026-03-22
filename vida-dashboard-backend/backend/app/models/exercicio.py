from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Treino(Base):
    __tablename__ = "treinos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data = Column(Date, nullable=False)
    # costas | triceps | biceps | perna | peito | ombro | cardio | full_body | outro
    categoria = Column(String, nullable=False)
    # abaixo_esperado | medio | acima_esperado
    qualidade = Column(String, nullable=False)
    calorias_gastas = Column(Float, nullable=True)
    observacoes = Column(String, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class PesoSemanal(Base):
    __tablename__ = "peso_semanal"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    semana_inicio = Column(Date, nullable=False)  # segunda-feira da semana
    peso_kg = Column(Float, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
