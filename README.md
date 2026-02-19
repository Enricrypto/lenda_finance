# Lenda Finance

A full-stack lending platform where users deposit real-world collateral (property, crypto, vehicles), borrow credit against it, and track their financial position in real time.

## Architecture

```
lenda/
├── backend/          # FastAPI REST API
│   ├── app/
│   │   ├── main.py          # Controller layer (endpoints)
│   │   ├── service.py        # Business logic
│   │   ├── repository.py     # Database queries
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── rules.py          # Business rules (asset types, loan statuses)
│   │   ├── config.py         # Pydantic settings (env vars)
│   │   └── database.py       # Engine, session, Base
│   ├── alembic/              # Database migrations
│   ├── tests/                # Pytest test suite
│   └── requirements.txt
│
└── frontend/         # Next.js 16 dashboard
    └── src/
        ├── app/
        │   ├── login/            # Public login page
        │   ├── signup/           # Public signup page
        │   └── (dashboard)/      # Auth-protected route group
        │       ├── overview/     # Platform analytics
        │       ├── users/        # User management
        │       ├── assets/       # Asset management
        │       ├── loans/        # Loan management
        │       └── settings/     # User settings
        ├── components/
        │   ├── landing/          # Login/signup page components
        │   ├── layout/           # Sidebar, Header
        │   └── shared/           # Reusable UI components
        ├── hooks/                # TanStack Query hooks
        ├── lib/
        │   └── services/         # API service layer (axios calls)
        ├── types/                # TypeScript interfaces
        └── proxy.ts              # Auth middleware (Next.js 16)
```

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM with PostgreSQL
- **Pydantic** — Request/response validation and settings management
- **Alembic** — Database migrations
- **Passlib + bcrypt** — Password hashing
- **PostgreSQL** on AWS RDS

### Frontend
- **Next.js 16** — React framework (App Router)
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **TanStack Query** — Server state management
- **NextAuth.js v4** — Authentication (Credentials provider + JWT)
- **Recharts** — Data visualizations
- **Iconify (Solar icons)** — Icon system
- **Sonner** — Toast notifications
- **Axios** — HTTP client

## Data Model

| Table   | Key Columns |
|---------|-------------|
| `users` | `id`, `name`, `email`, `password_hash` |
| `assets`| `id`, `user_id`, `type` (property/crypto/car), `value`, `created_at` |
| `loans` | `id`, `user_id`, `amount`, `amount_repaid`, `interest_rate`, `status` (pending/approved/repaid), `created_at` |

### Business Rules
- **Allowed asset types:** property, crypto, car
- **Depreciation rates:** property 1%, crypto 5%, car 10%
- **Default interest rate:** 5%
- **Available credit** = total deposited assets - total outstanding loans
- Users can only borrow up to their available credit

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Authenticate user (email + password) |
| `POST` | `/users` | Register a new user |
| `GET`  | `/users` | List all users |
| `GET`  | `/users/{user_id}` | Get user by ID |
| `POST` | `/assets` | Deposit a new asset |
| `GET`  | `/assets` | List all assets |
| `POST` | `/borrow` | Request a loan |
| `GET`  | `/loans` | List all loans |
| `POST` | `/repay/{loan_id}` | Repay a loan (partial or full) |
| `POST` | `/repay/batch` | Batch repay multiple loans |
| `GET`  | `/positions/{user_id}` | Get user's financial position |

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local or AWS RDS)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, SECRET_KEY, etc.

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and NextAuth secrets

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

**Backend** (`.env`):
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | App secret key | (generate a random string) |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `ENVIRONMENT` | `development` or `production` | `development` |

**Frontend** (`.env.local`):
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXTAUTH_URL` | NextAuth base URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | (generate a random string) |

## Testing

```bash
cd backend
PYTHONPATH=$(pwd) pytest -v tests/
```

## Author

Built by **Enrique Ibarra**.
