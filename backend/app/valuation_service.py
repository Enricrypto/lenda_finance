"""
Valuation Service — calculates eligible collateral for a given asset.

For MVP, valuation is deterministic: eligible_collateral = stated_value × ltv_ratio.
The LTV ratio is defined per asset type in rules.py.

Future: replace with real-time price feed per asset type.
"""
from dataclasses import dataclass
from .rules import ASSET_TYPE_CONFIG, ALLOWED_ASSET_TYPES


@dataclass
class ValuationResult:
    asset_type: str
    stated_value: float
    ltv_ratio: float
    appraised_value: float   # eligible collateral amount
    risk_tier: str


def appraise(asset_type: str, stated_value: float) -> ValuationResult:
    """
    Calculate eligible collateral for an asset.

    appraised_value = stated_value × ltv_ratio
    This is the amount that can be counted toward borrowing capacity.
    """
    asset_type = asset_type.strip().lower()
    if asset_type not in ALLOWED_ASSET_TYPES:
        raise ValueError(
            f"Unsupported asset type '{asset_type}'. "
            f"Allowed: {sorted(ALLOWED_ASSET_TYPES)}"
        )
    config = ASSET_TYPE_CONFIG[asset_type]
    return ValuationResult(
        asset_type=asset_type,
        stated_value=stated_value,
        ltv_ratio=config.ltv_ratio,
        appraised_value=stated_value * config.ltv_ratio,
        risk_tier=config.risk_tier,
    )
