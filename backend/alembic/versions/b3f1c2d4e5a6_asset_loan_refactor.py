"""asset and loan refactor — add valuation + risk columns

Revision ID: b3f1c2d4e5a6
Revises: 4bea07b02ac9
Create Date: 2026-02-25 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b3f1c2d4e5a6'
down_revision: Union[str, Sequence[str], None] = '4bea07b02ac9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Assets ──────────────────────────────────────────────────
    op.add_column('assets', sa.Column('description',     sa.String(),  nullable=True))
    op.add_column('assets', sa.Column('appraised_value', sa.Float(),   nullable=False, server_default='0'))
    op.add_column('assets', sa.Column('ltv_ratio',       sa.Float(),   nullable=False, server_default='0.5'))
    op.add_column('assets', sa.Column('status',          sa.String(),  nullable=False, server_default='active'))
    op.add_column('assets', sa.Column('appraised_at',    sa.DateTime(), nullable=True))

    # Backfill appraised_value per asset type (best-effort; exact values come from
    # the valuation service when new assets are added via the API).
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE assets SET appraised_value = value * 0.70, ltv_ratio = 0.70 WHERE type = 'property'"
    ))
    conn.execute(sa.text(
        "UPDATE assets SET appraised_value = value * 0.50, ltv_ratio = 0.50 WHERE type = 'crypto'"
    ))
    conn.execute(sa.text(
        "UPDATE assets SET appraised_value = value * 0.60, ltv_ratio = 0.60 WHERE type = 'car'"
    ))
    conn.execute(sa.text(
        "UPDATE assets SET appraised_at = created_at WHERE appraised_at IS NULL"
    ))

    # ── Loans ───────────────────────────────────────────────────
    op.add_column('loans', sa.Column('accrued_interest',        sa.Float(),   nullable=False, server_default='0'))
    op.add_column('loans', sa.Column('ltv_at_origination',      sa.Float(),   nullable=True))
    op.add_column('loans', sa.Column('health_factor_snapshot',  sa.Float(),   nullable=True))
    op.add_column('loans', sa.Column('rejection_reason',        sa.String(),  nullable=True))
    op.add_column('loans', sa.Column('collateral_value_locked', sa.Float(),   nullable=True))
    op.add_column('loans', sa.Column('activated_at',            sa.DateTime(), nullable=True))
    op.add_column('loans', sa.Column('repaid_at',               sa.DateTime(), nullable=True))

    # Migrate old 'approved' status to 'active'; backfill activated_at from created_at
    conn.execute(sa.text(
        "UPDATE loans SET status = 'active', activated_at = created_at WHERE status = 'approved'"
    ))
    conn.execute(sa.text(
        "UPDATE loans SET activated_at = created_at WHERE status = 'active' AND activated_at IS NULL"
    ))
    conn.execute(sa.text(
        "UPDATE loans SET repaid_at = created_at WHERE status = 'repaid' AND repaid_at IS NULL"
    ))


def downgrade() -> None:
    # Assets
    op.drop_column('assets', 'appraised_at')
    op.drop_column('assets', 'status')
    op.drop_column('assets', 'ltv_ratio')
    op.drop_column('assets', 'appraised_value')
    op.drop_column('assets', 'description')

    # Loans
    op.drop_column('loans', 'repaid_at')
    op.drop_column('loans', 'activated_at')
    op.drop_column('loans', 'collateral_value_locked')
    op.drop_column('loans', 'rejection_reason')
    op.drop_column('loans', 'health_factor_snapshot')
    op.drop_column('loans', 'ltv_at_origination')
    op.drop_column('loans', 'accrued_interest')
