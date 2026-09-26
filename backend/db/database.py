import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.environ.get("SQLITE_DB_PATH", "incidents.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Automatically add missing columns if upgrading an existing SQLite database
    with engine.connect() as conn:
        try:
            cursor = conn.exec_driver_sql("PRAGMA table_info(remediations)")
            existing_cols = {row[1] for row in cursor.fetchall()}
            new_cols = {
                "rollback_plan": "TEXT",
                "parameters": "JSON",
                "health_before": "JSON",
                "health_after": "JSON",
                "approved_at": "TEXT",
                "executed_at": "TEXT",
            }
            for col_name, col_type in new_cols.items():
                if col_name not in existing_cols:
                    conn.exec_driver_sql(f"ALTER TABLE remediations ADD COLUMN {col_name} {col_type}")
            conn.commit()
        except Exception:
            pass

