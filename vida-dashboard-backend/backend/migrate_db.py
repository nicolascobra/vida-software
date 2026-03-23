import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

sql1 = """
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(20) DEFAULT 'pix';
"""

# Categorias completas do frontend
sql2 = """
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_categoria_check;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_categoria_check
CHECK (categoria IN ('alimentacao', 'saude', 'transporte', 'lazer', 'moradia', 'educacao', 'investimento', 'salario', 'outros'));
"""

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute(sql1)
    print("Column tipo_pagamento added or checked.")
    
    cur.execute(sql2)
    print("Constraint transacoes_categoria_check updated.")
    
    conn.commit()
    print("Database migrations applied successfully!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error applying migrations: {e}")
