from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import exercicio, alimentacao, financas
# Import models to ensure they are registered in Base.metadata
from app.models import exercicio as model_exercicio
from app.models import alimentacao as model_alimentacao
from app.models import financas as model_financas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vida Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exercicio.router, prefix="/exercicio", tags=["Exercício"])
app.include_router(alimentacao.router, prefix="/alimentacao", tags=["Alimentação"])
app.include_router(financas.router, prefix="/financas", tags=["Finanças"])

@app.get("/")
def read_root():
    return {"status": "ok", "projeto": "Vida Dashboard"}
