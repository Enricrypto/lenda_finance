from sqlalchemy import text
from app.database import SessionLocal

def test_connection():
    try:
        db = SessionLocal()
        # Wrap raw SQL in text()
        result = db.execute(text("SELECT 1;"))
        print("Connection successful! Result:", result.scalar())
    except Exception as e:
        print("Connection failed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()
