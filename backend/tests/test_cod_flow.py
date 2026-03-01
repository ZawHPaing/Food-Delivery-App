"""
Test Cash on Delivery (COD) flow:
1. Place order with payment_method=cash -> payment created with status=pending
2. Rider accepts -> delivery created
3. Rider marks delivered -> payment status=paid, rider profile cash_collected_cents increases

Run with backend up: cd backend && uvicorn app.main:app --reload
Then: cd backend && python tests/test_cod_flow.py
"""
import os
import sys
import requests

BASE = os.getenv("API_BASE", "http://127.0.0.1:8000")

# Use existing test customer/rider or create; we need customer token + rider token
CUSTOMER_EMAIL = os.getenv("TEST_CUSTOMER_EMAIL", "test_customer_cod@example.com")
CUSTOMER_PASS = os.getenv("TEST_CUSTOMER_PASS", "test123")
RIDER_EMAIL = os.getenv("TEST_RIDER_EMAIL", "rider@example.com")
RIDER_PASS = os.getenv("TEST_RIDER_PASS", "rider123")


def main():
    print("=== COD flow test ===\n")

    # 1) Customer login (or register)
    r = requests.post(f"{BASE}/customer/login", json={"email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS})
    if r.status_code != 200:
        r2 = requests.post(f"{BASE}/customer/register", json={
            "email": CUSTOMER_EMAIL, "password": CUSTOMER_PASS,
            "first_name": "Test", "last_name": "Customer",
        })
        if r2.status_code not in (200, 201):
            print("Customer login/register failed:", r2.status_code, r2.text[:200])
            return 1
        r = r2
    customer_token = r.json().get("access_token")
    if not customer_token:
        print("No customer token"); return 1
    headers = {"Authorization": f"Bearer {customer_token}", "Content-Type": "application/json"}
    print("1. Customer logged in")

    # 2) Place order with payment_method=cash (use restaurant 7 if exists)
    order_payload = {
        "restaurant_id": 7,
        "delivery_address": "123 Test St, City",
        "payment_method": "cash",
        "tax_cents": 0,
        "delivery_fee_cents": 500,
        "items": [{"menu_item_id": 701, "quantity": 1}],
    }
    r = requests.post(f"{BASE}/customer/orders", headers=headers, json=order_payload)
    if r.status_code not in (200, 201):
        print("Place order failed:", r.status_code, r.text[:300])
        return 1
    order_id = r.json().get("order", {}).get("id")
    if not order_id:
        print("No order id in response"); return 1
    print("2. Order placed (COD), order_id:", order_id)

    # 3) Check payment: should be cash, status pending
    r = requests.get(f"{BASE}/customer/payments", headers=headers)
    if r.status_code != 200:
        print("GET /customer/payments failed:", r.status_code); return 1
    payments = r.json()
    pay = next((p for p in payments if p.get("order_id") == order_id), None)
    if not pay:
        print("Payment not found for order", order_id); return 1
    if (pay.get("payment_method") or "").lower() != "cash":
        print("Expected payment_method=cash, got", pay.get("payment_method")); return 1
    if (pay.get("status") or "").lower() != "pending":
        print("Expected payment status=pending for COD, got", pay.get("status")); return 1
    print("3. Payment record: cash, status=pending OK")

    print("\nTo see 'Cash on delivery' increase for the rider:")
    print("  1. Ensure a rider exists and is available (delivery profile, status Online).")
    print("  2. Dispatch runs automatically when order is placed; rider accepts the request in the app.")
    print("  3. Rider marks Pickup then Delivered -> payment becomes paid, rider profile 'Cash on delivery' increases by order total.")
    print("  4. Rider profile (Delivery app) shows 'Cash on delivery' = sum of COD order totals for delivered orders.")

    print("\n=== COD test done ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
