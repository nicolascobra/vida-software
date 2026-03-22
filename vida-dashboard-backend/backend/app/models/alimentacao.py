from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Alimentacao(Base):
    __tablename__ = "alimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data_registro = Column(DateTime(timezone=True), server_default=func.now())
    refeicao = Column(String, nullable=False)
    descricao = Column(String, nullable=False)
    calorias_estimadas = Column(Integer, nullable=True)
    observacoes = Column(String, nullable=True)
