from enum import Enum
from dataclasses import dataclass
from typing import Dict


# ----------------
# Asset Types
# ----------------
ALLOWED_ASSET_TYPES = {"property", "crypto", "car"}


@dataclass
class AssetTypeConfig:
    label: str
    ltv_ratio: float            # eligible collateral = stated_value * ltv_ratio
    liquidation_threshold: float  # LTV at which position becomes at risk
    risk_tier: str


ASSET_TYPE_CONFIG: Dict[str, AssetTypeConfig] = {
    "property": AssetTypeConfig(label="Property", ltv_ratio=0.70, liquidation_threshold=0.85, risk_tier="LOW"),
    "crypto":   AssetTypeConfig(label="Crypto",   ltv_ratio=0.50, liquidation_threshold=0.65, risk_tier="HIGH"),
    "car":      AssetTypeConfig(label="Car",       ltv_ratio=0.60, liquidation_threshold=0.75, risk_tier="MEDIUM"),
}


class AssetStatus(str, Enum):
    active = "active"
    locked = "locked"
    rejected = "rejected"


# ----------------
# Loan Statuses
# ----------------
class LoanStatus(str, Enum):
    pending    = "pending"
    active     = "active"
    repaid     = "repaid"
    rejected   = "rejected"
    liquidated = "liquidated"


# ----------------
# Risk Thresholds
# ----------------
HEALTH_FACTOR_SAFE    = 1.2   # Below this: warning
HEALTH_FACTOR_MIN     = 1.0   # Below this: rejected / liquidation territory
MAX_LTV               = 1.0   # Must stay below 100% (collateral covers full debt)
