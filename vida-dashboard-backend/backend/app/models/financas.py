from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Financas(Base):
    __tablename__ = "financas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    data_registro = Column(DateTime(timezone=True), server_default=func.now())
    valor = Column(Float, nullable=False)
    tipo = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
