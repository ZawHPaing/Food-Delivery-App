"""
Seed example vouchers. Run after vouchers_schema.sql has been applied in Supabase.
Requires: SUPABASE_URL, SUPABASE_KEY in backend/app/.env
Usage: from backend directory:  python seed_vouchers.py
"""
import sys
from pathlib import Path

# Run from backend directory so app package is available
_backend = Path(__file__).resolve().parent
sys.path.insert(0, str(_backend))

def main():
    from app.supabase_client import supabase

    vouchers = [
        {"code": "SAVE10", "discount_type": "percentage", "discount_value": 10, "min_order_cents": 2000, "is_active": True},
        {"code": "FLAT5", "discount_type": "fixed", "discount_value": 500, "min_order_cents": 1000, "is_active": True},
        {"code": "WELCOME20", "discount_type": "percentage", "discount_value": 20, "min_order_cents": 5000, "is_active": True},
    ]
    for v in vouchers:
        try:
            r = supabase.table("vouchers").select("id").eq("code", v["code"]).execute()
            if r.data and len(r.data) > 0:
                print(f"Voucher {v['code']} already exists, skip")
                continue
            supabase.table("vouchers").insert(v).execute()
            print(f"Inserted voucher: {v['code']}")
        except Exception as e:
            print(f"Error inserting {v['code']}: {e}")
    print("Done. Test codes: SAVE10 (10%% off min $20), FLAT5 ($5 off min $10), WELCOME20 (20%% off min $50).")

if __name__ == "__main__":
    main()
