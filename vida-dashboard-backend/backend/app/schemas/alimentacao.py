from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlimentacaoBase(BaseModel):
    user_id: str
    refeicao: str
    descricao: str
    calorias_estimadas: Optional[int] = None
    observacoes: Optional[str] = None

class AlimentacaoCreate(AlimentacaoBase):
    pass

class AlimentacaoResponse(AlimentacaoBase):
    id: int
    data_registro: datetime

    model_config = {"from_attributes": True}
