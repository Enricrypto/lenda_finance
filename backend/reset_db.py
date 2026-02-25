"""
Database reset utility — wipes all data and reinitialises schema.

Run from backend/ directory:
    python reset_db.py

Steps:
  1. Drop all tables (users, assets, loans)
  2. Re-create schema via Alembic migrations (alembic upgrade head)
  3. Run seed_data.py to insert demo data

WARNING: This permanently deletes all existing data.
"""
import subprocess
import sys
from sqlalchemy import text
from app.database import engine


def reset():
    print("=== Lenda DB Reset ===\n")

    # Step 1: Drop all data tables (reverse FK order)
    print("Dropping tables...")
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS loans"))
        conn.execute(text("DROP TABLE IF EXISTS assets"))
        conn.execute(text("DROP TABLE IF EXISTS users"))
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()
    print("  Done.\n")

    # Step 2: Re-create schema via migrations
    print("Running alembic upgrade head...")
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("  ERROR:\n", result.stderr)
        sys.exit(1)
    print(result.stdout or "  Done.\n")

    # Step 3: Seed demo data
    print("Seeding demo data...")
    result = subprocess.run(
        [sys.executable, "seed_data.py"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("  ERROR:\n", result.stderr)
        sys.exit(1)
    print(result.stdout)

    print("=== Reset complete ===")


if __name__ == "__main__":
    reset()
