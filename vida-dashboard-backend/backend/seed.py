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

from app.models.exercicio import Treino, PesoSemanal
from app.models.alimentacao import RefeicaoDiaria, ItemRefeicao
from app.models.financas import CentroCusto, Transacao, ConfiguracaoFinanceira

USUARIOS = ["nicolas", "andre"]
hoje = date.today()


# ════════════════════════════════════════════════════════════
# EXERCÍCIO
# ════════════════════════════════════════════════════════════

CATEGORIAS_TREINO = ["costas", "triceps", "biceps", "perna", "peito", "ombro", "cardio", "full_body"]
QUALIDADES = ["abaixo_esperado", "medio", "medio", "acima_esperado"]
PESO_INICIAL = {"nicolas": 82.0, "andre": 88.0}

treinos_inseridos = 0
for usuario in USUARIOS:
    for delta in range(60):
        dia = hoje - timedelta(days=delta)
        chance = 0.75 if dia.weekday() < 5 else 0.20
        if random.random() > chance:
            continue
        db.add(Treino(
            user_id=usuario,
            data=dia,
            categoria=random.choice(CATEGORIAS_TREINO),
            qualidade=random.choice(QUALIDADES),
            calorias_gastas=random.randint(280, 620) if random.random() > 0.3 else None,
        ))
        treinos_inseridos += 1

pesos_inseridos = 0
for usuario in USUARIOS:
    peso = PESO_INICIAL[usuario]
    for semana in range(10, 0, -1):
        segunda = hoje - timedelta(days=hoje.weekday()) - timedelta(weeks=semana - 1)
        peso = round(peso + random.uniform(-0.4, 0.3), 1)
        db.add(PesoSemanal(user_id=usuario, semana_inicio=segunda, peso_kg=peso))
        pesos_inseridos += 1


# ════════════════════════════════════════════════════════════
# ALIMENTAÇÃO
# Cardápio baseado no plano real do Nicolas.
# Cada alimento tem: (nome, quantidade_g, calorias, proteinas_g, carboidratos_g, gorduras_g)
# ════════════════════════════════════════════════════════════

CARDAPIO = {
    "pre_treino": [
        ("banana",             100, 89,  1.1, 23.0, 0.3),
        ("mamao",              150, 60,  0.6, 15.0, 0.1),
        ("aveia com mel",      60,  220, 6.0, 42.0, 3.5),
        ("pao integral com mel", 60, 170, 5.0, 34.0, 1.5),
        ("torradinha com mel", 40,  150, 3.0, 30.0, 1.0),
    ],
    "cafe_da_manha": [
        ("ovos mexidos",       120, 186, 14.0, 1.0,  13.0),
        ("queijo minas",       50,  65,  6.5,  1.0,  4.0),
        ("iogurte grego",      150, 130, 12.0, 8.0,  5.0),
        ("atum em lata",       80,  94,  20.0, 0.0,  1.5),
        ("aveia com mel",      60,  220, 6.0,  42.0, 3.5),
        ("banana",             100, 89,  1.1,  23.0, 0.3),
        ("pao integral",       50,  120, 4.5,  22.0, 1.5),
        ("abacate",            80,  128, 1.2,  6.5,  12.0),
        ("pasta de amendoim",  30,  186, 7.0,  6.5,  16.0),
    ],
    "lanche_manha": [
        ("ovo cozido",         60,  93,  8.0,  0.5,  6.5),
        ("atum em lata",       80,  94,  20.0, 0.0,  1.5),
        ("queijo minas",       50,  65,  6.5,  1.0,  4.0),
        ("banana",             100, 89,  1.1,  23.0, 0.3),
        ("mamao",              150, 60,  0.6,  15.0, 0.1),
        ("torradinha",         30,  120, 2.5,  24.0, 1.0),
        ("pao integral",       50,  120, 4.5,  22.0, 1.5),
        ("pasta de amendoim",  30,  186, 7.0,  6.5,  16.0),
        ("amendoim",           30,  176, 7.0,  5.0,  15.0),
    ],
    "almoco": [
        ("frango grelhado",    150, 248, 46.0, 0.0,  5.5),
        ("arroz branco",       150, 195, 3.5,  43.0, 0.5),
        ("feijao",             100, 132, 8.5,  24.0, 0.5),
        ("salada mista",       100, 25,  1.5,  4.0,  0.3),
        ("fruta da estacao",   120, 70,  0.8,  17.0, 0.2),
    ],
    "lanche_tarde": [
        ("atum em lata",       80,  94,  20.0, 0.0,  1.5),
        ("ovo cozido",         60,  93,  8.0,  0.5,  6.5),
        ("whey com agua",      35,  130, 25.0, 4.0,  1.5),
        ("banana",             100, 89,  1.1,  23.0, 0.3),
        ("aveia com mel",      50,  185, 5.0,  35.0, 3.0),
        ("mamao",              150, 60,  0.6,  15.0, 0.1),
        ("torradinha",         30,  120, 2.5,  24.0, 1.0),
        ("pasta de amendoim",  30,  186, 7.0,  6.5,  16.0),
    ],
    "janta": [
        ("frango grelhado",    150, 248, 46.0, 0.0,  5.5),
        ("arroz branco",       130, 169, 3.0,  37.0, 0.4),
        ("feijao",             100, 132, 8.5,  24.0, 0.5),
        ("salada mista",       100, 25,  1.5,  4.0,  0.3),
        ("fruta da estacao",   120, 70,  0.8,  17.0, 0.2),
    ],
    "ceia": [
        ("cha",                200, 2,   0.0,  0.4,  0.0),
        ("queijo minas",       40,  52,  5.2,  0.8,  3.2),
        ("iogurte grego",      100, 87,  8.0,  5.0,  3.5),
        ("banana",             80,  71,  0.9,  18.0, 0.2),
        ("mel",                15,  46,  0.1,  12.5, 0.0),
        ("mamao",              100, 40,  0.4,  10.0, 0.1),
    ],
}

# Quantas refeições cada tipo tem por dia (nem sempre todas acontecem)
CHANCE_REFEICAO = {
    "pre_treino":    0.70,  # só nos dias de treino basicamente
    "cafe_da_manha": 0.90,
    "lanche_manha":  0.75,
    "almoco":        0.95,
    "lanche_tarde":  0.80,
    "janta":         0.90,
    "ceia":          0.60,
}

refeicoes_inseridas = 0
itens_inseridos = 0

for usuario in USUARIOS:
    for delta in range(30):  # últimos 30 dias
        dia = hoje - timedelta(days=delta)

        # Cria o registro diário
        teve_desvio = random.random() < 0.15
        refeicao_dia = RefeicaoDiaria(
            user_id=usuario,
            data=dia,
            desvio_plano=teve_desvio,
            observacoes_desvio="comeu fora" if teve_desvio else None,
        )
        db.add(refeicao_dia)
        db.flush()  # garante que refeicao_dia.id seja gerado antes de usá-lo

        refeicoes_inseridas += 1

        for tipo, chance in CHANCE_REFEICAO.items():
            if random.random() > chance:
                continue

            # Sorteia 2 a 4 alimentos do cardápio desse tipo de refeição
            opcoes = CARDAPIO[tipo]
            qtd_itens = min(random.randint(2, 4), len(opcoes))
            escolhas = random.sample(opcoes, qtd_itens)

            for nome, qtd_g, kcal, ptn, carb, gord in escolhas:
                db.add(ItemRefeicao(
                    refeicao_diaria_id=refeicao_dia.id,
                    tipo_refeicao=tipo,
                    alimento=nome,
                    quantidade_g=qtd_g,
                    calorias=kcal,
                    proteinas_g=ptn,
                    carboidratos_g=carb,
                    gorduras_g=gord,
                ))
                itens_inseridos += 1


# ════════════════════════════════════════════════════════════
# FINANÇAS
# ════════════════════════════════════════════════════════════

RENDA = {"nicolas": 5000.0, "andre": 6000.0}

CENTROS_CUSTO = {
    "nicolas": [
        ("alimentacao",  800.0),
        ("transporte",   300.0),
        ("lazer",        400.0),
        ("saude",        200.0),
        ("moradia",      1500.0),
        ("investimento", 1000.0),
    ],
    "andre": [
        ("alimentacao",  900.0),
        ("transporte",   350.0),
        ("lazer",        500.0),
        ("saude",        200.0),
        ("moradia",      1800.0),
        ("investimento", 1200.0),
    ],
}

GASTOS_FIXOS = {
    "moradia":    {"descricao": "aluguel", "valor_base": None},   # usa limite_mensal
    "saude":      {"descricao": "plano de saude", "valor_base": None},
}

GASTOS_VARIAVEIS = {
    "alimentacao": ["mercado", "restaurante", "lanche", "delivery"],
    "transporte":  ["uber", "gasolina", "onibus"],
    "lazer":       ["bar", "cinema", "viagem", "presente"],
    "investimento":["aporte mensal"],
}

centros_inseridos = 0
transacoes_inseridas = 0
config_inseridas = 0

for usuario in USUARIOS:
    # Configuração de renda dos últimos 3 meses
    for m in range(3, 0, -1):
        primeiro_dia = (hoje.replace(day=1) - timedelta(days=30 * (m - 1))).replace(day=1)
        db.add(ConfiguracaoFinanceira(
            user_id=usuario,
            renda_mensal=RENDA[usuario],
            mes_referencia=primeiro_dia,
        ))
        config_inseridas += 1

    # Centros de custo
    for categoria, limite in CENTROS_CUSTO[usuario]:
        db.add(CentroCusto(user_id=usuario, categoria=categoria, limite_mensal=limite))
        centros_inseridos += 1

    # Transações dos últimos 60 dias
    for delta in range(60):
        dia = hoje - timedelta(days=delta)

        # Entrada mensal no dia 5
        if dia.day == 5:
            db.add(Transacao(
                user_id=usuario,
                data=dia,
                tipo="entrada",
                valor=RENDA[usuario],
                categoria="salario",
                descricao="salario mensal",
                custo_fixo=True,
            ))
            transacoes_inseridas += 1

        # Gastos fixos no dia 10
        if dia.day == 10:
            for cat, info in GASTOS_FIXOS.items():
                limite = dict(CENTROS_CUSTO[usuario]).get(cat)
                if not limite:
                    continue
                db.add(Transacao(
                    user_id=usuario,
                    data=dia,
                    tipo="saida",
                    valor=limite,
                    categoria=cat,
                    descricao=info["descricao"],
                    custo_fixo=True,
                ))
                transacoes_inseridas += 1

        # Gastos variáveis aleatórios
        for cat, descricoes in GASTOS_VARIAVEIS.items():
            if cat == "investimento":
                continue  # investimento entra só uma vez por mês
            if random.random() > 0.25:  # ~25% de chance por dia por categoria
                continue
            limite = dict(CENTROS_CUSTO[usuario]).get(cat, 500)
            valor = round(random.uniform(15, limite * 0.25), 2)
            db.add(Transacao(
                user_id=usuario,
                data=dia,
                tipo="saida",
                valor=valor,
                categoria=cat,
                descricao=random.choice(descricoes),
                custo_fixo=False,
            ))
            transacoes_inseridas += 1

        # Aporte de investimento no dia 15
        if dia.day == 15:
            limite_invest = dict(CENTROS_CUSTO[usuario]).get("investimento", 1000)
            db.add(Transacao(
                user_id=usuario,
                data=dia,
                tipo="saida",
                valor=limite_invest,
                categoria="investimento",
                descricao="aporte mensal",
                custo_fixo=True,
            ))
            transacoes_inseridas += 1


# ════════════════════════════════════════════════════════════
# COMMIT
# ════════════════════════════════════════════════════════════

db.commit()
db.close()

print(f"OK: {treinos_inseridos} treinos inseridos")
print(f"OK: {pesos_inseridos} registros de peso inseridos")
print(f"OK: {refeicoes_inseridas} dias de refeição inseridos ({itens_inseridos} itens)")
print(f"OK: {centros_inseridos} centros de custo inseridos")
print(f"OK: {transacoes_inseridas} transações inseridas")
print(f"OK: {config_inseridas} configurações de renda inseridas")
print("Supabase populado com sucesso!")
