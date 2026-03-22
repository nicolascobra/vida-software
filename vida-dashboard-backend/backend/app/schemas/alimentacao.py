from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class ItemRefeicaoCreate(BaseModel):
    refeicao_diaria_id: int
    tipo_refeicao: str  # cafe_da_manha | almoco | lanche | jantar | ceia
    alimento: str
    quantidade_g: float
    calorias: float
    proteinas_g: Optional[float] = None
    carboidratos_g: Optional[float] = None
    gorduras_g: Optional[float] = None


class ItemRefeicaoResponse(ItemRefeicaoCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class RefeicaoDiariaCreate(BaseModel):
    user_id: str
    data: date
    desvio_plano: bool = False
    observacoes_desvio: Optional[str] = None


class RefeicaoDiariaResponse(RefeicaoDiariaCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}
