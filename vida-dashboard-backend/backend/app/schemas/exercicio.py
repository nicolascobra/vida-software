from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class TreinoCreate(BaseModel):
    user_id: str
    data: date
    categoria: List[str]
    qualidade: str  # abaixo_esperado | medio | acima_esperado
    calorias_gastas: Optional[float] = None
    observacoes: Optional[str] = None


class TreinoResponse(TreinoCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class PesoSemanalCreate(BaseModel):
    user_id: str
    semana_inicio: date
    peso_kg: float


class PesoSemanalResponse(PesoSemanalCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}
