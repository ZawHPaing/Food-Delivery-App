# Testing Backend & Frontend

## Prerequisites

- Backend running: `cd backend && uvicorn app.main:app --reload` (or `python -m uvicorn app.main:app --reload`)
- Backend uses `backend/app/.env` with `SUPABASE_URL` and `SUPABASE_KEY`

## Backend API tests

From **backend** directory:

```cmd
python tests/test_customer_restaurant_api.py
```

Tests:

- `GET /` root
- **Auth**: register customer, login customer
- **Customer**: profile, addresses, orders (with token)
- **Vouchers**: validate (customer + consumer). If you get 500, run `supabase/vouchers_schema.sql` in Supabase then optionally `python seed_vouchers.py`
- **Consumer**: GET /consumer/restaurants (public)
- **Restaurant**: profile without token → 401; with token → 200 or 404 (no restaurant row)

## Frontend API test (same as login/register flow)

From **frontend** directory (Node 18+):

```cmd
node scripts/test-api.mjs
```

Uses the same endpoints as the app: register → login → customer profile, addresses, orders.

## Manual browser testing

1. Start backend (port 8000) and frontend (`npm run dev`, port 3000).
2. **Customer**: Open http://localhost:3000/register → create account → then http://localhost:3000/login → sign in → visit /consumer_module, /consumer_module/orders, /consumer_module/profile, /consumer_module/checkout (with items in cart).
3. **Vouchers**: Run `supabase/vouchers_schema.sql` and `backend/seed_vouchers.py`, then at checkout apply code e.g. `SAVE10` (10% off, min $20).
4. **Restaurant**: Register with user_type restaurant (e.g. restaurant portal or auth/user/register), then ensure a row in `restaurants` with that user's id as owner_id/user_id for GET /restaurant/profile to return 200.

## Seed vouchers (optional)

After applying `supabase/vouchers_schema.sql`:

```cmd
cd backend
python seed_vouchers.py
```

Example codes: SAVE10, FLAT5, WELCOME20 (see script for min order and discount).
