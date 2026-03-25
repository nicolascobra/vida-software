from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# ── Tabela Nutricional ────────────────────────────────────────

class TabelaNutricionalCreate(BaseModel):
    alimento: str
    descricao_unidade: str = "1 unidade"
    kcal: float
    proteina: float = 0
    carboidrato: float = 0
    gordura: float = 0


class TabelaNutricionalResponse(TabelaNutricionalCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Itens de Refeição ─────────────────────────────────────────

class ItemRefeicaoCreate(BaseModel):
    refeicao_diaria_id: int
    tipo_refeicao: str
    alimento: str
    quantidade_g: float = 0
    tabela_nutricional_id: Optional[int] = None
    quantidade: float = 1
    calorias: float
    proteinas_g: Optional[float] = None
    carboidratos_g: Optional[float] = None
    gorduras_g: Optional[float] = None


class ItemRefeicaoResponse(ItemRefeicaoCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Refeição Diária ───────────────────────────────────────────

class RefeicaoDiariaCreate(BaseModel):
    user_id: str
    data: date
    desvio_plano: bool = False
    observacoes_desvio: Optional[str] = None


class RefeicaoDiariaResponse(RefeicaoDiariaCreate):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Registro completo (nova refeição com múltiplos alimentos) ─

class ItemRefeicaoInput(BaseModel):
    tabela_nutricional_id: Optional[int] = None
    alimento: str
    quantidade: float
    calorias: float
    proteinas: float = 0
    carboidratos: float = 0
    gorduras: float = 0


class RefeicaoCompletaCreate(BaseModel):
    user_id: str
    data: date
    tipo: str  # pre_treino | cafe_manha | lanche_manha | almoco | lanche_tarde | jantar | ceia
    itens: List[ItemRefeicaoInput]
