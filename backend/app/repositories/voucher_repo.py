"""Repository for vouchers: lookup by code, validate, increment use_count.
If the vouchers table does not exist in the database, all methods fail gracefully (return None / error message).
"""
from typing import Optional, Dict
from datetime import datetime
from ..supabase_client import supabase


class VoucherRepository:
    @staticmethod
    def get_by_code(code: str) -> Optional[Dict]:
        if not code or not code.strip():
            return None
        try:
            clean = code.strip().upper()
            resp = supabase.table("vouchers").select("*").ilike("code", clean).maybe_single().execute()
            if not resp or not getattr(resp, "data", None):
                return None
            return resp.data
        except Exception:
            return None

    @staticmethod
    def validate(
        code: str,
        subtotal_cents: int,
        restaurant_id: Optional[int] = None,
    ) -> tuple[Optional[Dict], Optional[str]]:
        """
        Returns (voucher_row, error_message).
        If valid, error_message is None and voucher_row has discount_cents computed.
        If vouchers table is missing, get_by_code returns None so error_message is 'Invalid voucher code'.
        """
        row = VoucherRepository.get_by_code(code)
        if not row:
            return None, "Invalid voucher code"
        if not row.get("is_active"):
            return None, "Voucher is no longer active"
        now = datetime.utcnow()
        valid_from = row.get("valid_from")
        if valid_from:
            try:
                if isinstance(valid_from, str):
                    valid_from = datetime.fromisoformat(valid_from.replace("Z", "+00:00"))
                if now < valid_from:
                    return None, "Voucher is not yet valid"
            except Exception:
                pass
        valid_until = row.get("valid_until")
        if valid_until:
            try:
                if isinstance(valid_until, str):
                    valid_until = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
                if now > valid_until:
                    return None, "Voucher has expired"
            except Exception:
                pass
        min_order = int(row.get("min_order_cents") or 0)
        if subtotal_cents < min_order:
            return None, f"Minimum order for this voucher is {min_order / 100:.2f}"
        rid = row.get("restaurant_id")
        if rid is not None and restaurant_id is not None and int(rid) != int(restaurant_id):
            return None, "Voucher is not valid for this restaurant"
        max_uses = row.get("max_uses")
        use_count = int(row.get("use_count") or 0)
        if max_uses is not None and use_count >= int(max_uses):
            return None, "Voucher has reached its use limit"
        # Compute discount_cents
        discount_type = row.get("discount_type") or "fixed"
        discount_value = int(row.get("discount_value") or 0)
        if discount_type == "percentage":
            discount_cents = min(subtotal_cents * discount_value // 100, subtotal_cents)
        else:
            discount_cents = min(discount_value, subtotal_cents)
        out = dict(row)
        out["discount_cents"] = discount_cents
        return out, None

    @staticmethod
    def increment_use(voucher_id: int) -> bool:
        try:
            resp = supabase.table("vouchers").select("use_count").eq("id", voucher_id).maybe_single().execute()
            if not resp.data:
                return False
            new_count = int(resp.data.get("use_count") or 0) + 1
            supabase.table("vouchers").update({
                "use_count": new_count,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", voucher_id).execute()
            return True
        except Exception:
            return False
