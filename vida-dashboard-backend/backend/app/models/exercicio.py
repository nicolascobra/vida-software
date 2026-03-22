from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Exercicio(Base):
    __tablename__ = "exercicios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data_registro = Column(DateTime(timezone=True), server_default=func.now())
    tipo_exercicio = Column(String, nullable=False)
    duracao_minutos = Column(Integer, nullable=False)
    intensidade = Column(String, nullable=False)
    observacoes = Column(String, nullable=True)
