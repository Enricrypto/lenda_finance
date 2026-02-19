from enum import Enum

ALLOWED_ASSET_TYPES = {"property", "crypto", "car"}

ASSET_DEFAULT_RATES = {
    "property": {"depreciation_rate": 0.01},
    "crypto": {"depreciation_rate": 0.05},
    "car": {"depreciation_rate": 0.10},
}

class LoanStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    repaid = "repaid"

