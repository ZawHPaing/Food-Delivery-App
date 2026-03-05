# Customer Module  
**DP Essential – Sem 8 Group 11 SE**

This module gives customers a single place to discover restaurants, browse menus, place orders, and track deliveries—from browsing to checkout and order history.

---

## 1 of 5 — Browse & Discovery

**Home & Restaurant Discovery**
- The home page loads **real restaurants** from the API (no mock data): nearest restaurants, featured restaurants, and popular restaurants.
- **Popular Orders** shows real menu items from restaurants so users can jump straight to a dish or restaurant.
- Search and category filters help narrow results by cuisine and preferences.

**All Restaurants**
- A dedicated restaurants list page shows all approved restaurants with ratings, delivery time, and delivery fee.
- Sort by popularity, rating, distance, or name. Filter by cuisine (e.g. Fast Food, Pizza, Asian, Coffee).
- Each restaurant card links to that restaurant’s detail and menu.

---

## 2 of 5 — Restaurant & Menu

**Restaurant Detail**
- Each restaurant has a detail page with name, cuisine, rating, review count, delivery time, and delivery fee.
- **Popular Items** displays the first six menu items for quick add-to-cart.
- **Main Menu** is grouped by categories (e.g. Shan Noodles, Mandalay Meeshay); users can jump to a category from a sticky nav.

**Cart & Ordering**
- Users add items with quantity and optional special instructions.
- A floating cart shows item count and total; opening it shows the full cart with options to edit or proceed to checkout.
- Cart is scoped per restaurant so users order from one restaurant at a time.

---

## 3 of 5 — Checkout & Payment

**Delivery Address**
- At checkout, users choose a **saved address** from their profile or **enter an address manually** (street, city, state, postal code, country).
- A link to “Manage addresses in profile” lets them add or edit addresses without leaving the flow.

**Payment Options**
- **Cash on delivery (COD):** Pay in cash to the rider when the order is delivered; order is placed and the user is redirected to the order page.
- **Credit / Debit card:** Pay with Stripe; after placing the order, the user completes payment on a secure form and is redirected to an order success page on completion.

**Order Summary**
- Checkout sidebar shows line items, subtotal, delivery fee, tax, and total so the customer confirms the amount before placing the order.

---

## 4 of 5 — Orders & Tracking

**Order History**
- **My Orders** lists all orders for the logged-in customer with status (Pending, Confirmed, Preparing, Ready, On the way, Delivered, Cancelled).
- Each order shows restaurant name, total, and status; clicking an order opens its detail page.

**Order Detail & Live Updates**
- The order detail page shows full order info: items, delivery address, payment method, and status.
- Customers get **live updates** as the order moves from restaurant (preparing → ready) to rider (picked up → on the way) to delivered, so they know exactly where their order is.

---

## 5 of 5 — Profile & Addresses

**Profile Management**
- Customers can update **name** (first, last) and **phone**.
- **Email** can be changed with verification; **password** can be changed with current-password confirmation.
- Success and error messages confirm each update.

**Saved Addresses**
- Multiple delivery addresses can be saved with street, city, state, postal code, country, and an optional label (e.g. Home, Work).
- One address can be set as **default** for faster checkout.
- Addresses can be added, edited, and deleted; they are used at checkout as “Saved addresses” and can be managed from profile.

**Account Security**
- Sign-in is required for checkout, orders, and profile; redirects to login preserve the intended destination (e.g. checkout, orders) so after sign-in the user returns to the right page.

---

*Customer Module – DP Essential Sem 8 Group 11 SE*
