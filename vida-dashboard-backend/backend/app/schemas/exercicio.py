from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExercicioBase(BaseModel):
    user_id: str
    tipo_exercicio: str
    duracao_minutos: int
    intensidade: str
    observacoes: Optional[str] = None

class ExercicioCreate(ExercicioBase):
    pass

class ExercicioResponse(ExercicioBase):
    id: int
    data_registro: datetime

    model_config = {"from_attributes": True}
