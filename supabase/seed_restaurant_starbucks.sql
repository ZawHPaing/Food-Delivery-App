-- Seed restaurant id 7 (Starbucks) and its menu/menu_items so backend place_order finds them.
-- Run in Supabase SQL Editor. Frontend cart uses restaurant_id=7 and menu_item ids 701, 702, 705, etc.

-- Restaurant 7: Starbucks
INSERT INTO public.restaurants (id, name, description, city, cuisine_type, average_rating, total_reviews, is_approved)
VALUES (
  7,
  'Starbucks',
  'Premium coffee experience. Handcrafted beverages made just the way you like them, plus delicious food items.',
  'Yangon',
  'Coffee',
  4.5,
  120,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  cuisine_type = EXCLUDED.cuisine_type,
  is_approved = EXCLUDED.is_approved;

-- Menu 7 for Starbucks
INSERT INTO public.menus (id, restaurant_id, name, is_active)
VALUES (7, 7, 'Drinks & Food', true)
ON CONFLICT (id) DO UPDATE SET restaurant_id = EXCLUDED.restaurant_id, name = EXCLUDED.name, is_active = EXCLUDED.is_active;

-- Menu items (ids must match frontend cart: 701 Caramel Macchiato, 702 Iced White Mocha, 705 Chocolate Croissant, etc.)
INSERT INTO public.menu_items (id, menu_id, name, description, price_cents, is_available) VALUES
  (701, 7, 'Caramel Macchiato', 'Espresso with vanilla syrup, steamed milk, and caramel drizzle.', 549, true),
  (702, 7, 'Iced White Mocha', 'Espresso with white chocolate mocha sauce, milk, and ice.', 599, true),
  (703, 7, 'Caffè Latte', 'Rich espresso with steamed milk.', 449, true),
  (704, 7, 'Matcha Green Tea Latte', 'Sweetened matcha green tea with steamed milk.', 549, true),
  (705, 7, 'Chocolate Croissant', 'Buttery croissant with two strips of chocolate.', 399, true),
  (706, 7, 'Bacon & Gouda Sandwich', 'Applewood-smoked bacon and aged Gouda on artisan roll.', 549, true)
ON CONFLICT (id) DO UPDATE SET
  menu_id = EXCLUDED.menu_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  is_available = EXCLUDED.is_available;
