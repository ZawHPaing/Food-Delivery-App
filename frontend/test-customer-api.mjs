/**
 * Test customer flows from frontend perspective (same endpoints as UI).
 * Run from frontend folder: node test-customer-api.mjs
 * Backend must be at http://localhost:8000
 */
const BASE = "http://localhost:8000";

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log("=== Customer API tests (frontend flows) ===\n");

  // 1) Discovery (no auth)
  console.log("1. GET /restaurants (discovery)...");
  const r1 = await request("GET", "/restaurants");
  const list = Array.isArray(r1.data?.restaurants) ? r1.data.restaurants : [];
  console.log(r1.ok ? `   OK: ${list.length} restaurants` : `   FAIL ${r1.status}: ${JSON.stringify(r1.data)}`);

  // 2) Register
  const email = `testfe${Date.now()}@example.com`;
  console.log("\n2. POST /auth/user/register...");
  const r2 = await request("POST", "/auth/user/register", {
    first_name: "Frontend",
    last_name: "Test",
    email,
    phone: "+959876543",
    password: "test123",
    user_type: "customer",
  });
  const token = r2.data?.access_token;
  const user = r2.data?.user;
  console.log(r2.ok ? `   OK: user_id=${user?.id} email=${user?.email}` : `   FAIL ${r2.status}: ${JSON.stringify(r2.data)}`);
  if (!token) {
    console.log("\n   Register failed, skipping login and profile.");
    return;
  }

  // 3) Login (same user)
  console.log("\n3. POST /auth/user/login...");
  const r3 = await request("POST", "/auth/user/login", { email, password: "test123" });
  const loginToken = r3.data?.access_token;
  console.log(r3.ok ? `   OK: token received` : `   FAIL ${r3.status}: ${JSON.stringify(r3.data)}`);
  if (!loginToken) {
    console.log("\n   Login failed, skipping profile.");
    return;
  }

  // 4) Customer profile (auth required)
  console.log("\n4. GET /customer/profile...");
  const r4 = await request("GET", "/customer/profile", null, loginToken);
  console.log(r4.ok ? `   OK: ${r4.data?.email}` : `   FAIL ${r4.status}: ${JSON.stringify(r4.data)}`);

  // 5) Customer orders
  console.log("\n5. GET /customer/orders...");
  const r5 = await request("GET", "/customer/orders", null, loginToken);
  const orders = Array.isArray(r5.data) ? r5.data : [];
  console.log(r5.ok ? `   OK: ${orders.length} orders` : `   FAIL ${r5.status}: ${JSON.stringify(r5.data)}`);

  // 6) Restaurant detail (no auth)
  if (list.length > 0) {
    const id = list[0].id;
    console.log(`\n6. GET /restaurants/${id} (menu)...`);
    const r6 = await request("GET", `/restaurants/${id}`);
    console.log(r6.ok && r6.data?.id ? `   OK: ${r6.data.name}` : `   FAIL ${r6.status}: ${JSON.stringify(r6.data)}`);
  }

  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
