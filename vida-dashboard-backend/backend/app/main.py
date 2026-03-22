from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base
from app.routes import exercicio, alimentacao, financas, nota_fiscal

# Registra todos os models antes de criar as tabelas
from app.models import exercicio as model_exercicio      # Treino, PesoSemanal
from app.models import alimentacao as model_alimentacao  # RefeicaoDiaria, ItemRefeicao
from app.models import financas as model_financas        # CentroCusto, Transacao

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vida Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exercicio.router, prefix="/exercicio", tags=["Exercício"])
app.include_router(alimentacao.router, prefix="/alimentacao", tags=["Alimentação"])
app.include_router(financas.router, prefix="/financas", tags=["Finanças"])
app.include_router(nota_fiscal.router, prefix="/nota-fiscal", tags=["Nota Fiscal"])


@app.get("/")
def read_root():
    return {"status": "ok", "projeto": "Vida Dashboard"}
