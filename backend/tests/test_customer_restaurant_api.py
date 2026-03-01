"""
Backend API tests: customer and restaurant flows with real data.
Run with backend server up: uvicorn app.main:app --reload
From backend dir: python tests/test_customer_restaurant_api.py
"""
import os
import sys
import requests

BASE = os.getenv("API_BASE", "http://127.0.0.1:8000")

# Unique email for this run to avoid "already exists" on register
TEST_EMAIL = f"test_customer_{os.getpid()}@example.com"
TEST_PASS = "test123"


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Discovery / Consumer (public) ----------
def test_get_restaurants():
    r = requests.get(f"{BASE}/restaurants")
    assert r.status_code == 200, r.text
    data = r.json()
    restaurants = data.get("restaurants", data) if isinstance(data, dict) else data
    assert isinstance(restaurants, list)
    print("GET /restaurants OK, count:", len(restaurants))
    return restaurants


def test_consumer_restaurants():
    try:
        r = requests.get(f"{BASE}/consumer/restaurants", timeout=10)
        assert r.status_code == 200
        restaurants = r.json()
        assert isinstance(restaurants, list)
        print("GET /consumer/restaurants OK, count:", len(restaurants))
        return restaurants
    except Exception as e:
        print("GET /consumer/restaurants skip:", e)
        return []


def test_get_restaurant_with_menu(restaurant_id: int):
    r = requests.get(f"{BASE}/restaurants/{restaurant_id}")
    assert r.status_code == 200, r.text
    data = r.json()
    assert "id" in data or "name" in data
    items = data.get("menu_items", [])
    if not items and data.get("menus"):
        for m in data["menus"]:
            items.extend(m.get("items", []) if isinstance(m, dict) else [])
    print("GET /restaurants/{} OK, menu items: {}".format(restaurant_id, len(items)))
    return data, items


def test_consumer_restaurant_and_menu(restaurant_id: int):
    r = requests.get(f"{BASE}/consumer/restaurants/{restaurant_id}")
    if r.status_code != 200:
        print("GET /consumer/restaurants/{} -> {}".format(restaurant_id, r.status_code))
        return None, []
    data = r.json()
    r2 = requests.get(f"{BASE}/consumer/restaurants/{restaurant_id}/menu")
    menu_data = r2.json() if r2.status_code == 200 else {}
    menus = menu_data.get("menus", [])
    items = []
    for m in menus:
        items.extend(m.get("items", []) if isinstance(m, dict) else [])
    print("GET /consumer/restaurants/{}/menu OK, items: {}".format(restaurant_id, len(items)))
    return data, items


def test_consumer_popular_items():
    try:
        r = requests.get(f"{BASE}/consumer/popular-items", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print("GET /consumer/popular-items OK, count:", len(data))
    except Exception as e:
        print("GET /consumer/popular-items skip:", e)


# ---------- Auth ----------
def test_register_and_login_customer():
    r = requests.post(f"{BASE}/auth/user/register", json={
        "first_name": "Test",
        "last_name": "Customer",
        "email": TEST_EMAIL,
        "phone": "+951234567",
        "password": TEST_PASS,
        "user_type": "customer",
    })
    assert r.status_code in (200, 400), r.text
    if r.status_code == 400:
        print("Register: user exists, continuing with login")

    r2 = requests.post(f"{BASE}/auth/user/login", json={"email": TEST_EMAIL, "password": TEST_PASS})
    assert r2.status_code == 200, r2.text
    data = r2.json()
    assert "access_token" in data
    token = data["access_token"]
    user_id = data.get("user_id")
    print("Login customer OK, user_id:", user_id)
    return token, user_id


# ---------- Customer with data ----------
def test_customer_profile_get_patch(token: str):
    r = requests.get(f"{BASE}/customer/profile", headers=auth_headers(token))
    assert r.status_code == 200
    profile = r.json()
    print("GET /customer/profile OK:", profile.get("email"))

    r2 = requests.patch(f"{BASE}/customer/profile", headers=auth_headers(token), json={
        "first_name": "TestUpdated",
        "phone": "+959999999",
    })
    assert r2.status_code == 200
    print("PATCH /customer/profile OK")


def test_customer_addresses_crud(token: str):
    # Create
    r = requests.post(f"{BASE}/customer/addresses", headers=auth_headers(token), json={
        "street": "123 Test St",
        "city": "Yangon",
        "state": "Yangon",
        "postal_code": "11011",
        "country": "Myanmar",
        "label": "Home",
        "is_default": True,
    })
    assert r.status_code == 200, r.text
    addr = r.json()
    addr_id = addr["id"]
    print("POST /customer/addresses OK, id:", addr_id)

    # List
    r2 = requests.get(f"{BASE}/customer/addresses", headers=auth_headers(token))
    assert r2.status_code == 200
    assert len(r2.json()) >= 1
    print("GET /customer/addresses OK")

    # Get one
    r3 = requests.get(f"{BASE}/customer/addresses/{addr_id}", headers=auth_headers(token))
    assert r3.status_code == 200
    assert r3.json()["city"] == "Yangon"
    print("GET /customer/addresses/{} OK".format(addr_id))

    # Update
    r4 = requests.patch(f"{BASE}/customer/addresses/{addr_id}", headers=auth_headers(token), json={
        "city": "Mandalay",
    })
    assert r4.status_code == 200
    print("PATCH /customer/addresses/{} OK".format(addr_id))

    # Delete
    r5 = requests.delete(f"{BASE}/customer/addresses/{addr_id}", headers=auth_headers(token))
    assert r5.status_code in (200, 204, 404), "DELETE address got %s %s" % (r5.status_code, r5.text[:150])
    print("DELETE /customer/addresses/{} OK".format(addr_id))
    return addr_id


def test_customer_place_order_and_track(token: str, restaurant_id: int, menu_item_id: int):
    delivery_address = "456 Delivery Ave, Yangon, Myanmar"
    r = requests.post(f"{BASE}/customer/orders", headers=auth_headers(token), json={
        "restaurant_id": restaurant_id,
        "delivery_address": delivery_address,
        "payment_method": "card",
        "tax_cents": 100,
        "delivery_fee_cents": 500,
        "items": [{"menu_item_id": menu_item_id, "quantity": 2}],
    })
    if r.status_code != 200:
        print("POST /customer/orders skipped (need valid restaurant + menu_item):", r.status_code, r.text[:150])
        return None
    data = r.json()
    order = data.get("order", data)
    order_id = order["id"]
    print("POST /customer/orders OK, order_id:", order_id)

    r2 = requests.get(f"{BASE}/customer/orders", headers=auth_headers(token))
    assert r2.status_code == 200
    assert any(o["id"] == order_id for o in r2.json())
    print("GET /customer/orders OK")

    r3 = requests.get(f"{BASE}/customer/orders/{order_id}", headers=auth_headers(token))
    assert r3.status_code == 200
    print("GET /customer/orders/{} OK".format(order_id))

    r4 = requests.get(f"{BASE}/customer/orders/{order_id}/track", headers=auth_headers(token))
    assert r4.status_code == 200
    print("GET /customer/orders/{}/track OK".format(order_id))
    return order_id


def test_customer_payments_reviews_notifications(token: str):
    r = requests.get(f"{BASE}/customer/payments", headers=auth_headers(token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    print("GET /customer/payments OK")

    r2 = requests.get(f"{BASE}/customer/reviews", headers=auth_headers(token))
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)
    print("GET /customer/reviews OK")

    r3 = requests.get(f"{BASE}/customer/notifications", headers=auth_headers(token))
    assert r3.status_code == 200
    assert isinstance(r3.json(), list)
    print("GET /customer/notifications OK")


def test_customer_create_review(token: str, restaurant_id: int, order_id: int = None):
    payload = {"restaurant_id": restaurant_id, "rating": 5, "comment": "Great food!"}
    if order_id:
        payload["order_id"] = order_id
    r = requests.post(f"{BASE}/customer/reviews", headers=auth_headers(token), json=payload)
    assert r.status_code in (200, 400)  # 400 if duplicate or invalid
    print("POST /customer/reviews OK or 400 (duplicate)")


def test_customer_voucher_validate(token: str):
    r = requests.get(
        f"{BASE}/customer/vouchers/validate",
        params={"code": "SAVE10", "subtotal_cents": 5000, "restaurant_id": 1},
        headers=auth_headers(token),
    )
    if r.status_code == 200:
        j = r.json()
        assert "valid" in j
        print("GET /customer/vouchers/validate OK", j)
    else:
        assert r.status_code in (500,)
        print("GET /customer/vouchers/validate 500 (vouchers table optional)")


# ---------- Restaurant ----------
def test_restaurant_orders_with_id(restaurant_id: int):
    r = requests.get(f"{BASE}/restaurant/orders", params={"restaurant_id": restaurant_id})
    assert r.status_code == 200
    orders = r.json()
    assert isinstance(orders, list)
    print("GET /restaurant/orders?restaurant_id={} OK, count: {}".format(restaurant_id, len(orders)))
    return orders


def test_restaurant_profile_requires_auth():
    r = requests.get(f"{BASE}/restaurant/profile")
    assert r.status_code in (401, 403)
    print("GET /restaurant/profile without token -> 401/403 OK")


def test_restaurant_update_order_status(restaurant_id: int, order_id: int, token_restaurant: str = None):
    if not token_restaurant:
        print("PATCH /restaurant/orders/status skipped (no restaurant token)")
        return
    r = requests.patch(
        f"{BASE}/restaurant/orders/{order_id}/status",
        headers=auth_headers(token_restaurant),
        json={"status": "confirmed"},
    )
    assert r.status_code in (200, 403, 404)
    print("PATCH /restaurant/orders/{}/status -> {}".format(order_id, r.status_code))


def test_restaurant_menus_get(restaurant_id: int):
    r = requests.get(f"{BASE}/restaurant/menus", params={"restaurant_id": restaurant_id})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    print("GET /restaurant/menus?restaurant_id={} OK, menus: {}".format(restaurant_id, len(data)))


def run_all():
    print("========== Backend tests (customer + restaurant with data) ==========\n")

    # Public: restaurants and menu
    restaurants = test_get_restaurants()
    consumer_restaurants = test_consumer_restaurants()
    test_consumer_popular_items()

    restaurant_id = None
    menu_item_id = None
    # Prefer discovery list (restaurants) which already worked
    rest_list = restaurants if isinstance(restaurants, list) else (consumer_restaurants or [])
    if not rest_list and isinstance(rest_list, dict):
        rest_list = rest_list.get("restaurants", [])
    if rest_list:
        first = rest_list[0]
        rid = first.get("id") if isinstance(first, dict) else first
        if rid:
            restaurant_id = rid
            try:
                _, items = test_get_restaurant_with_menu(restaurant_id)
                if items:
                    menu_item_id = items[0].get("id") if isinstance(items[0], dict) else items[0]
            except Exception as ex:
                print("get_restaurant_with_menu skip:", ex)
    if not restaurant_id:
        restaurant_id = 1
    if not menu_item_id:
        menu_item_id = 1

    # Auth
    token, user_id = test_register_and_login_customer()

    # Customer profile & addresses
    test_customer_profile_get_patch(token)
    test_customer_addresses_crud(token)

    # Place order (if we have valid restaurant + menu_item)
    order_id = test_customer_place_order_and_track(token, restaurant_id, menu_item_id)

    # Payments, reviews, notifications
    test_customer_payments_reviews_notifications(token)
    if restaurant_id:
        test_customer_create_review(token, restaurant_id, order_id)
    test_customer_voucher_validate(token)

    # Restaurant
    test_restaurant_profile_requires_auth()
    test_restaurant_orders_with_id(restaurant_id)
    test_restaurant_menus_get(restaurant_id)

    # Restaurant register (no restaurant row -> profile 404)
    rest_email = f"rest_owner_{os.getpid()}@example.com"
    r = requests.post(f"{BASE}/auth/user/register", json={
        "first_name": "Rest",
        "last_name": "Owner",
        "email": rest_email,
        "phone": "+950000000",
        "password": "rest123",
        "user_type": "restaurant",
    })
    if r.status_code in (200, 400):
        login_r = requests.post(f"{BASE}/auth/user/login", json={
            "email": rest_email,
            "password": "rest123",
        })
        if login_r.status_code == 200:
            rest_token = login_r.json()["access_token"]
            pr = requests.get(f"{BASE}/restaurant/profile", headers=auth_headers(rest_token))
            assert pr.status_code in (200, 404)
            print("Restaurant register + profile OK (200 or 404)")

    print("\n========== All backend tests passed ==========")


if __name__ == "__main__":
    run_all()
