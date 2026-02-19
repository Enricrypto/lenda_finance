from app.database import SessionLocal
from app.models import User

db = SessionLocal()

# 1. Create
new_user = User(name="TestUser", email="testuser@example.com")
db.add(new_user)
db.commit()
db.refresh(new_user)
print("Created user:", new_user.id, new_user.name)

# 2. Read
user = db.query(User).filter_by(email="testuser@example.com").first()
print("Queried user:", user.id, user.name)

# 3. Update
user.name = "UpdatedUser"
db.commit()
print("Updated user name to:", user.name)

# 4. Delete
db.delete(user)
db.commit()
print("Deleted user")
