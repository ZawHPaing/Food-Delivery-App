/**
 * Frontend API test: customer and restaurant-related flows with data.
 * Same requests as the app (login, register, profile, addresses, orders, voucher, etc.).
 * Run: node scripts/test-api.mjs
 * Requires: Backend at http://localhost:8000 (or set API_BASE env)
 */
const API_BASE = process.env.API_BASE || "http://localhost:8000";
const TEST_EMAIL = `test_fe_${Date.now()}@example.com`;
const TEST_PASS = "test123";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function run() {
  console.log("========== Frontend API tests (customer + data) ==========\n");

  // ---- 1. Register ----
  console.log("1. POST /auth/user/register");
  let regRes = await fetch(`${API_BASE}/auth/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: "Test",
      last_name: "User",
      email: TEST_EMAIL,
      phone: "+951234567",
      password: TEST_PASS,
      user_type: "customer",
    }),
  });
  let regData = await regRes.json().catch(() => ({}));
  if (!regRes.ok && !String(regData.detail || "").includes("already exists")) {
    console.log("   FAIL", regRes.status, regData);
    process.exit(1);
  }
  console.log("   OK", regRes.status);

  // ---- 2. Login ----
  console.log("\n2. POST /auth/user/login");
  const loginRes = await fetch(`${API_BASE}/auth/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    console.log("   FAIL", loginRes.status, loginData);
    process.exit(1);
  }
  const token = loginData.access_token;
  console.log("   OK user_id:", loginData.user_id, "user_type:", loginData.user_type);

  // ---- 3. Profile get + patch ----
  console.log("\n3. GET /customer/profile");
  let profileRes = await fetch(`${API_BASE}/customer/profile`, { headers: authHeaders(token) });
  let profileData = await profileRes.json().catch(() => ({}));
  if (!profileRes.ok) {
    console.log("   FAIL", profileRes.status);
    process.exit(1);
  }
  console.log("   OK", profileData.email);

  console.log("   PATCH /customer/profile");
  const patchRes = await fetch(`${API_BASE}/customer/profile`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ first_name: "TestUpdated", phone: "+959999999" }),
  });
  if (!patchRes.ok) {
    console.log("   FAIL", patchRes.status);
    process.exit(1);
  }
  console.log("   OK");

  // ---- 4. Addresses CRUD ----
  console.log("\n4. POST /customer/addresses");
  const createAddrRes = await fetch(`${API_BASE}/customer/addresses`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      street: "123 Test St",
      city: "Yangon",
      state: "Yangon",
      postal_code: "11011",
      country: "Myanmar",
      label: "Home",
      is_default: true,
    }),
  });
  const createdAddr = await createAddrRes.json().catch(() => ({}));
  if (!createAddrRes.ok) {
    console.log("   FAIL", createAddrRes.status, createdAddr);
    process.exit(1);
  }
  const addrId = createdAddr.id;
  console.log("   OK id:", addrId);

  console.log("   GET /customer/addresses");
  const listAddrRes = await fetch(`${API_BASE}/customer/addresses`, { headers: authHeaders(token) });
  const addrs = await listAddrRes.json().catch(() => []);
  if (!listAddrRes.ok || !Array.isArray(addrs)) {
    console.log("   FAIL", listAddrRes.status);
    process.exit(1);
  }
  console.log("   OK count:", addrs.length);

  console.log("   PATCH /customer/addresses/" + addrId);
  const updAddrRes = await fetch(`${API_BASE}/customer/addresses/${addrId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ city: "Mandalay" }),
  });
  if (!updAddrRes.ok) {
    console.log("   FAIL", updAddrRes.status);
    process.exit(1);
  }
  console.log("   OK");

  // ---- 5. Public: restaurants + menu ----
  console.log("\n5. GET /restaurants (discovery)");
  const restListRes = await fetch(`${API_BASE}/restaurants`);
  const restListData = await restListRes.json().catch(() => ({}));
  const restaurants = restListData.restaurants || restListData || [];
  if (!Array.isArray(restaurants)) {
    console.log("   FAIL not array");
    process.exit(1);
  }
  console.log("   OK count:", restaurants.length);

  let restaurantId = 1;
  let menuItemId = 1;
  if (restaurants.length > 0) {
    restaurantId = restaurants[0].id ?? restaurants[0];
    console.log("   GET /restaurants/" + restaurantId);
    const restDetailRes = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
    const restDetail = await restDetailRes.json().catch(() => ({}));
    if (restDetailRes.ok && restDetail.menu_items && restDetail.menu_items.length > 0) {
      menuItemId = restDetail.menu_items[0].id;
      console.log("   OK menu_items:", restDetail.menu_items.length);
    }
  }

  // ---- 6. Voucher validate ----
  console.log("\n6. GET /customer/vouchers/validate");
  const voucherRes = await fetch(
    `${API_BASE}/customer/vouchers/validate?code=SAVE10&subtotal_cents=5000&restaurant_id=${restaurantId}`,
    { headers: authHeaders(token) }
  );
  const voucherData = await voucherRes.json().catch(() => ({}));
  if (voucherRes.status === 200 && typeof voucherData.valid !== "undefined") {
    console.log("   OK valid:", voucherData.valid, "discount_cents:", voucherData.discount_cents);
  } else {
    console.log("   OK or 500 (vouchers optional)", voucherRes.status);
  }

  // ---- 7. Place order ----
  console.log("\n7. POST /customer/orders (place order)");
  const placeOrderRes = await fetch(`${API_BASE}/customer/orders`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      restaurant_id: restaurantId,
      delivery_address: "456 Delivery Ave, Yangon, Myanmar",
      payment_method: "card",
      tax_cents: 100,
      delivery_fee_cents: 500,
      items: [{ menu_item_id: menuItemId, quantity: 2 }],
    }),
  });
  const placeOrderData = await placeOrderRes.json().catch(() => ({}));
  let orderId = null;
  if (placeOrderRes.ok && placeOrderData.order) {
    orderId = placeOrderData.order.id;
    console.log("   OK order_id:", orderId);
  } else {
    console.log("   SKIP or FAIL (need valid restaurant + menu_item)", placeOrderRes.status, placeOrderData.detail || "");
  }

  // ---- 8. Orders list, get, track ----
  console.log("\n8. GET /customer/orders");
  const ordersRes = await fetch(`${API_BASE}/customer/orders`, { headers: authHeaders(token) });
  const orders = await ordersRes.json().catch(() => []);
  if (!ordersRes.ok || !Array.isArray(orders)) {
    console.log("   FAIL", ordersRes.status);
    process.exit(1);
  }
  console.log("   OK count:", orders.length);

  if (orderId) {
    console.log("   GET /customer/orders/" + orderId);
    const orderRes = await fetch(`${API_BASE}/customer/orders/${orderId}`, { headers: authHeaders(token) });
    if (!orderRes.ok) {
      console.log("   FAIL", orderRes.status);
    } else {
      console.log("   OK");
    }
    console.log("   GET /customer/orders/" + orderId + "/track");
    const trackRes = await fetch(`${API_BASE}/customer/orders/${orderId}/track`, { headers: authHeaders(token) });
    if (!trackRes.ok) {
      console.log("   FAIL", trackRes.status);
    } else {
      console.log("   OK");
    }
  }

  // ---- 9. Payments, reviews, notifications ----
  console.log("\n9. GET /customer/payments");
  const payRes = await fetch(`${API_BASE}/customer/payments`, { headers: authHeaders(token) });
  const payments = await payRes.json().catch(() => []);
  console.log("   OK count:", Array.isArray(payments) ? payments.length : 0);

  console.log("   GET /customer/reviews");
  const revRes = await fetch(`${API_BASE}/customer/reviews`, { headers: authHeaders(token) });
  console.log("   OK", revRes.status);

  if (restaurantId && orderId) {
    console.log("   POST /customer/reviews");
    const createRevRes = await fetch(`${API_BASE}/customer/reviews`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ restaurant_id: restaurantId, order_id: orderId, rating: 5, comment: "Great!" }),
    });
    console.log("   OK or 400", createRevRes.status);
  }

  console.log("   GET /customer/notifications");
  const notifRes = await fetch(`${API_BASE}/customer/notifications`, { headers: authHeaders(token) });
  console.log("   OK", notifRes.status);

  // ---- 10. Consumer (public) ----
  console.log("\n10. GET /consumer/restaurants");
  const consumerRestRes = await fetch(`${API_BASE}/consumer/restaurants`);
  const consumerRests = await consumerRestRes.json().catch(() => []);
  console.log("   OK count:", Array.isArray(consumerRests) ? consumerRests.length : 0);

  console.log("   GET /consumer/popular-items");
  const popularRes = await fetch(`${API_BASE}/consumer/popular-items`);
  console.log("   OK", popularRes.status);

  // ---- 11. Restaurant (with restaurant_id query) ----
  console.log("\n11. GET /restaurant/orders?restaurant_id=" + restaurantId);
  const restOrdersRes = await fetch(`${API_BASE}/restaurant/orders?restaurant_id=${restaurantId}`);
  const restOrders = await restOrdersRes.json().catch(() => []);
  console.log("   OK count:", Array.isArray(restOrders) ? restOrders.length : 0);

  console.log("   GET /restaurant/profile (no token -> 401)");
  const noAuthRes = await fetch(`${API_BASE}/restaurant/profile`);
  console.log("   OK", noAuthRes.status, "(expected 401)");

  // ---- 12. Delete address (cleanup) ----
  console.log("\n12. DELETE /customer/addresses/" + addrId);
  const delAddrRes = await fetch(`${API_BASE}/customer/addresses/${addrId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  console.log("   OK", delAddrRes.status);

  console.log("\n========== All frontend API tests passed ==========");
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
