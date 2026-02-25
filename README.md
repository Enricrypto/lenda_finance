# Lenda Finance

A personal asset-backed lending platform. Deposit collateral, borrow against it, and track your financial position in real time.

**Live demo:** [lenda.vercel.app](https://lenda.vercel.app) — `demo@lenda.com / password123`

---

## Architecture

```
lenda/
├── backend/          # FastAPI REST API
│   ├── app/
│   │   ├── main.py           # Controller layer (routes)
│   │   ├── service.py        # Business logic
│   │   ├── repository.py     # Database queries
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── rules.py          # Asset types, loan statuses, risk thresholds
│   │   ├── auth_service.py   # JWT issuance/validation, password hashing
│   │   ├── dependencies.py   # get_current_user FastAPI dependency
│   │   ├── valuation_service.py  # LTV-based asset appraisal
│   │   ├── risk_engine.py    # Health factor & loan eligibility
│   │   ├── config.py         # Pydantic settings (env vars)
│   │   └── database.py       # Engine, session, Base
│   ├── alembic/              # Database migrations
│   ├── tests/                # Pytest test suite
│   ├── seed_data.py          # Demo seed script
│   ├── reset_db.py           # Wipe + migrate + seed
│   └── requirements.txt
│
└── frontend/         # Next.js dashboard
    └── src/
        ├── app/
        │   ├── login/            # Public login page
        │   ├── signup/           # Public signup page
        │   └── (dashboard)/      # Auth-protected route group
        │       ├── overview/     # Personal financial position
        │       ├── assets/       # Collateral management
        │       ├── loans/        # Loan management
        │       └── settings/     # User settings
        ├── components/
        │   ├── landing/          # Login/signup components
        │   ├── layout/           # Sidebar, Header
        │   └── shared/           # Reusable UI components
        ├── hooks/                # TanStack Query hooks
        ├── lib/
        │   ├── services/         # API service layer (axios calls)
        │   ├── auth.ts           # NextAuth config
        │   ├── api.ts            # Axios instance + Bearer interceptor
        │   └── formatters.ts     # Currency, date, percent formatting
        └── types/                # TypeScript interfaces
```

---

## Tech Stack

### Backend
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM with PostgreSQL
- **Pydantic v2** — Request/response validation and settings
- **Alembic** — Database migrations
- **python-jose** — JWT signing and verification
- **Passlib + bcrypt** — Password hashing (10 rounds)
- **PostgreSQL** on AWS RDS

### Frontend
- **Next.js 15** — React framework (App Router)
- **TypeScript** — Type safety
- **Tailwind CSS v4** — Styling
- **TanStack Query** — Server state management
- **NextAuth.js v4** — Authentication (Credentials provider + JWT session)
- **Recharts** — Data visualizations (pie chart, position gauges)
- **Iconify** — Icon system
- **Sonner** — Toast notifications
- **Axios** — HTTP client with Bearer token interceptor

---

## Data Model

| Table | Key Columns |
|---|---|
| `users` | `id` (UUID), `name`, `email`, `password_hash` |
| `assets` | `id`, `user_id`, `type`, `value` (stated), `appraised_value`, `ltv_ratio`, `status` |
| `loans` | `id`, `user_id`, `amount`, `amount_repaid`, `accrued_interest`, `interest_rate`, `status`, `activated_at`, `repaid_at` |

### Business Rules

- **Asset types:** `property` (70% LTV), `crypto` (50% LTV), `car` (60% LTV)
- **Eligible collateral** = `stated_value × ltv_ratio` per asset
- **Health factor** = `eligible_collateral / outstanding_debt` — must be ≥ 1.0
- **Max LTV** = 100% (debt cannot exceed collateral)
- **Interest** = simple interest at 5% p.a., accrued from loan activation date
- **Repayment waterfall** = interest paid first, then principal
- **All routes are user-scoped** — `user_id` derived from JWT, never from request body

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✓ | Current user |
| GET | `/assets` | ✓ | List user's assets |
| POST | `/assets/preview` | ✓ | Valuation dry-run (no DB write) |
| POST | `/assets` | ✓ | Add collateral asset |
| GET | `/loans` | ✓ | List user's loans |
| POST | `/loans/evaluate` | ✓ | Risk engine dry-run (no DB write) |
| POST | `/loans` | ✓ | Request a loan |
| POST | `/loans/{id}/repay` | ✓ | Repay a loan (partial or full) |
| GET | `/position` | ✓ | Full financial position |

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local or AWS RDS)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Set DATABASE_URL, SECRET_KEY, FRONTEND_URL

alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload
```

API available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL, API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET

npm run dev
```

App available at `http://localhost:3000`.

### Environment Variables

**Backend** (`.env`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `FRONTEND_URL` | Allowed CORS origin |

**Frontend** (`.env.local`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (used client-side) |
| `API_URL` | Backend API URL (used server-side by NextAuth) |
| `NEXTAUTH_URL` | Full URL of the frontend |
| `NEXTAUTH_SECRET` | Session encryption secret |

---

## Database Reset

```bash
cd backend
source venv/bin/activate
python reset_db.py   # drops all tables → runs migrations → seeds demo data
```

Demo accounts (all password: `password123`):
- `demo@lenda.com` — property + crypto + car, active loan + rejected loan
- `alice@lenda.com`, `bob@lenda.com`, `carol@lenda.com` — supporting accounts

---

## EC2 Deployment

```bash
ssh -i ~/.ssh/lenda-key.pem ubuntu@<EC2_IP>
cd ~/lenda_finance/backend
git pull
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart lenda
```

---

## Testing

```bash
cd backend
PYTHONPATH=$(pwd) pytest -v tests/
```

---

Built by [Enrique Ibarra](https://github.com/Enricrypto)
