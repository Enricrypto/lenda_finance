from app.database import engine, Base
from app.models import User, Asset, Loan  # import all your SQLAlchemy models

# Create all tables in Postgres
Base.metadata.create_all(bind=engine)

print("Tables created successfully in Postgres!")
