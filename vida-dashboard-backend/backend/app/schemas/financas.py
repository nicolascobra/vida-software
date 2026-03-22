from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FinancasBase(BaseModel):
    user_id: str
    valor: float
    tipo: str
    categoria: str
    descricao: Optional[str] = None

class FinancasCreate(FinancasBase):
    pass

class FinancasResponse(FinancasBase):
    id: int
    data_registro: datetime

    model_config = {"from_attributes": True}
