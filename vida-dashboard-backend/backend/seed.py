"""
seed.py — Insere dados fictícios no Supabase para visualizar a dashboard.
Execute com: python seed.py
(rode dentro da pasta backend/)

ATENÇÃO: só rode isso se o banco estiver vazio ou se quiser dados de teste.
Os dados vão para o Supabase real — todos que compartilham o mesmo .env verão os mesmos dados.
"""
import os
import random
from datetime import date, timedelta
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não definida no .env")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Importa os models para usar o ORM (sem SQL manual)
from app.models.exercicio import Treino, PesoSemanal

CATEGORIAS = ["costas", "triceps", "biceps", "perna", "peito", "ombro", "cardio", "full_body"]
QUALIDADES = ["abaixo_esperado", "medio", "medio", "acima_esperado"]  # medio mais frequente
USUARIOS = ["nicolas", "andre"]

hoje = date.today()

# ── Treinos: últimos 60 dias ──────────────────────────────────────────────────
treinos_inseridos = 0
for usuario in USUARIOS:
    for delta in range(60):
        dia = hoje - timedelta(days=delta)
        dia_semana = dia.weekday()  # 0=seg … 6=dom

        chance = 0.75 if dia_semana < 5 else 0.20
        if random.random() > chance:
            continue

        treino = Treino(
            user_id=usuario,
            data=dia,
            categoria=random.choice(CATEGORIAS),
            qualidade=random.choice(QUALIDADES),
            calorias_gastas=random.randint(280, 620) if random.random() > 0.3 else None,
            observacoes=None,
        )
        db.add(treino)
        treinos_inseridos += 1

# ── Peso semanal: últimas 10 semanas ─────────────────────────────────────────
pesos_inseridos = 0
PESO_INICIAL = {"nicolas": 82.0, "andre": 88.0}

for usuario in USUARIOS:
    peso = PESO_INICIAL[usuario]
    for semana in range(10, 0, -1):
        segunda = hoje - timedelta(days=hoje.weekday()) - timedelta(weeks=semana - 1)
        peso += round(random.uniform(-0.4, 0.3), 1)
        peso = round(peso, 1)

        registro = PesoSemanal(
            user_id=usuario,
            semana_inicio=segunda,
            peso_kg=peso,
        )
        db.add(registro)
        pesos_inseridos += 1

db.commit()
db.close()

print(f"OK: {treinos_inseridos} treinos inseridos")
print(f"OK: {pesos_inseridos} registros de peso inseridos")
print("Supabase populado com sucesso!")
