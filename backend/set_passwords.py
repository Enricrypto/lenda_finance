"""
One-off script: sets password_hash = hash("password123") for any user
whose password_hash is currently NULL.

Run from backend/: python set_passwords.py
"""
from app.database import SessionLocal
from app.models import User
from app.service import pwd_context

db = SessionLocal()

users = db.query(User).filter(User.password_hash == None).all()  # noqa: E711
if not users:
    print("All users already have a password hash — nothing to do.")
else:
    hashed = pwd_context.hash("password123")
    for user in users:
        user.password_hash = hashed
        print(f"  + set password for {user.email}")
    db.commit()
    print(f"\nDone. Updated {len(users)} user(s).")

db.close()
