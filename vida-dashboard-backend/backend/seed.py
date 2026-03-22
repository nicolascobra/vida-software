"""
seed.py — Insere dados fictícios no banco para visualizar a dashboard.
Execute com: python seed.py
(rode dentro da pasta backend/)
"""
import sqlite3
import random
from datetime import date, timedelta

DB_PATH = "vida_dashboard.db"

CATEGORIAS = ["costas", "triceps", "biceps", "perna", "peito", "ombro", "cardio", "full_body"]
QUALIDADES = ["abaixo_esperado", "medio", "medio", "acima_esperado"]  # medio mais frequente

USUARIOS = ["nicolas", "andre"]

conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()

hoje = date.today()

# ── Treinos: últimos 60 dias ──────────────────────────────────────────────────
# Segunda a sexta com ~75% de chance de ter treino; fins de semana com ~20%
treinos_inseridos = 0
for usuario in USUARIOS:
    for delta in range(60):
        dia = hoje - timedelta(days=delta)
        dia_semana = dia.weekday()  # 0=seg … 6=dom

        chance = 0.75 if dia_semana < 5 else 0.20
        if random.random() > chance:
            continue

        categoria     = random.choice(CATEGORIAS)
        qualidade     = random.choice(QUALIDADES)
        calorias      = random.randint(280, 620) if random.random() > 0.3 else None
        observacoes   = None

        cur.execute("""
            INSERT INTO treinos (user_id, data, categoria, qualidade, calorias_gastas, observacoes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (usuario, dia.isoformat(), categoria, qualidade, calorias, observacoes))
        treinos_inseridos += 1

# ── Peso semanal: últimas 10 semanas ─────────────────────────────────────────
pesos_inseridos = 0
PESO_INICIAL = {"nicolas": 82.0, "andre": 88.0}

for usuario in USUARIOS:
    peso = PESO_INICIAL[usuario]
    for semana in range(10, 0, -1):
        # Segunda-feira da semana correspondente
        segunda = hoje - timedelta(days=hoje.weekday()) - timedelta(weeks=semana - 1)
        # Variação realista: -0.4 a +0.3 kg por semana
        peso += round(random.uniform(-0.4, 0.3), 1)
        peso  = round(peso, 1)

        cur.execute("""
            INSERT INTO peso_semanal (user_id, semana_inicio, peso_kg)
            VALUES (?, ?, ?)
        """, (usuario, segunda.isoformat(), peso))
        pesos_inseridos += 1

conn.commit()
conn.close()

print(f"OK: {treinos_inseridos} treinos inseridos")
print(f"OK: {pesos_inseridos} registros de peso inseridos")
print("Banco populado com sucesso!")
