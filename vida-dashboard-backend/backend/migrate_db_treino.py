import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")

sql1 = """
ALTER TABLE treinos
ALTER COLUMN categoria TYPE TEXT[]
USING ARRAY[categoria];
"""

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute(sql1)
    conn.commit()
    print("Database migration for Treinos applied successfully!")
    cur.close()
    conn.close()
except psycopg2.errors.DatatypeMismatch:
    print("Data type mismatch or already an array.")
except Exception as e:
    print(f"Error applying migrations: {e}")
