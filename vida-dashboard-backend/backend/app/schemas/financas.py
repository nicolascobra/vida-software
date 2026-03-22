from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CentroCustoCreate(BaseModel):
    user_id: str
    categoria: str
    limite_mensal: float


class CentroCustoResponse(CentroCustoCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class TransacaoCreate(BaseModel):
    user_id: str
    data: date
    tipo: str  # entrada | saida
    valor: float
    categoria: str
    descricao: Optional[str] = None
    custo_fixo: bool = False


class TransacaoResponse(TransacaoCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class ConfiguracaoFinanceiraCreate(BaseModel):
    user_id: str
    renda_mensal: float
    mes_referencia: date  # dia 01 do mês


class ConfiguracaoFinanceiraResponse(ConfiguracaoFinanceiraCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}
