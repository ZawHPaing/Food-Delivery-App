from typing import List, Optional, Dict
from ..repositories.customer_repo import CustomerRepository
from ..repositories.user_repo import UserRepository
from ..models.customer_models import (
    AddressResponse,
    PaymentResponse,
    OrderResponse,
    OrderItemResponse,
    ReviewResponse,
    NotificationResponse,
    CustomerProfileResponse,
)


class CustomerService:
    """Business logic for customer module. Matches Supabase schema: no customers/carts; payments per order; orders use delivery_address text."""

    @staticmethod
    def get_profile(user_id: int) -> Optional[CustomerProfileResponse]:
        """Get customer profile from users table only."""
        user = UserRepository.find_user_by_id(user_id)
        if not user or user.get("user_type") != "customer":
            return None
        return CustomerProfileResponse(
            user_id=user_id,
            first_name=user.get("first_name"),
            last_name=user.get("last_name"),
            email=user.get("email"),
            phone=user.get("phone"),
        )

    @staticmethod
    def update_profile(user_id: int, data: dict) -> Optional[CustomerProfileResponse]:
        """Update user profile (first_name, last_name, phone)."""
        user_up = {k: v for k, v in data.items() if k in ("first_name", "last_name", "phone") and v is not None}
        if user_up:
            UserRepository.update_user(user_id, user_up)
        return CustomerService.get_profile(user_id)

    # ----- Addresses -----
    @staticmethod
    def list_addresses(user_id: int) -> List[AddressResponse]:
        rows = CustomerRepository.get_addresses_by_user_id(user_id)
        return [AddressResponse(**r) for r in rows]

    @staticmethod
    def get_address(user_id: int, address_id: int) -> Optional[AddressResponse]:
        row = CustomerRepository.get_address_by_id(address_id, user_id)
        return AddressResponse(**row) if row else None

    @staticmethod
    def create_address(user_id: int, data: dict) -> Optional[AddressResponse]:
        row = CustomerRepository.create_address(user_id, data)
        return AddressResponse(**row) if row else None

    @staticmethod
    def update_address(user_id: int, address_id: int, data: dict) -> Optional[AddressResponse]:
        row = CustomerRepository.update_address(address_id, user_id, data)
        return AddressResponse(**row) if row else None

    @staticmethod
    def delete_address(user_id: int, address_id: int) -> bool:
        return CustomerRepository.delete_address(address_id, user_id)

    @staticmethod
    def format_address_as_text(address: dict) -> str:
        """Build delivery_address text from an address row."""
        parts = [address.get("street"), address.get("city"), address.get("state"), address.get("postal_code"), address.get("country")]
        return ", ".join(p for p in parts if p)

    # ----- Payments (read-only; created when placing order) -----
    @staticmethod
    def list_payments(user_id: int) -> List[PaymentResponse]:
        rows = CustomerRepository.get_payments_by_user_id(user_id)
        return [
            PaymentResponse(
                id=r["id"],
                order_id=r["order_id"],
                user_id=r.get("user_id"),
                status=r.get("status"),
                amount_cents=r["amount_cents"],
                payment_method=r.get("payment_method"),
                transaction_id=r.get("transaction_id"),
                paid_at=r.get("paid_at"),
            )
            for r in rows
        ]

    @staticmethod
    def get_payment(user_id: int, payment_id: int) -> Optional[PaymentResponse]:
        row = CustomerRepository.get_payment_by_id(payment_id, user_id)
        if not row:
            return None
        return PaymentResponse(
            id=row["id"],
            order_id=row["order_id"],
            user_id=row.get("user_id"),
            status=row.get("status"),
            amount_cents=row["amount_cents"],
            payment_method=row.get("payment_method"),
            transaction_id=row.get("transaction_id"),
            paid_at=row.get("paid_at"),
        )

    # ----- Orders -----
    @staticmethod
    def place_order(
        user_id: int,
        restaurant_id: int,
        delivery_address: str,
        payment_method: str,
        tax_cents: int,
        delivery_fee_cents: int,
        items: List[Dict],
    ) -> Optional[OrderResponse]:
        """Place order: resolve prices from menu_items, create order, order_items, and payment."""
        restaurant = CustomerRepository.get_restaurant_by_id(restaurant_id)
        if not restaurant:
            return None
        menu_item_ids = [i["menu_item_id"] for i in items]
        menu_map = CustomerRepository.get_menu_items_by_ids(menu_item_ids)
        if len(menu_map) != len(menu_item_ids):
            return None  # all menu items must exist
        subtotal_cents = 0
        for it in items:
            price_cents = menu_map[it["menu_item_id"]]["price_cents"]
            subtotal_cents += it["quantity"] * price_cents
        total_cents = subtotal_cents + tax_cents + delivery_fee_cents
        if total_cents <= 0:
            return None
        order_data = {
            "restaurant_id": restaurant_id,
            "status": "pending",
            "subtotal_cents": subtotal_cents,
            "tax_cents": tax_cents,
            "delivery_fee_cents": delivery_fee_cents,
            "total_cents": total_cents,
            "delivery_address": delivery_address,
        }
        order = CustomerRepository.create_order(user_id, order_data)
        if not order:
            return None
        for it in items:
            price_cents = menu_map[it["menu_item_id"]]["price_cents"]
            CustomerRepository.create_order_item(
                order["id"],
                it["menu_item_id"],
                it["quantity"],
                price_cents,
                it.get("special_instructions"),
            )
        CustomerRepository.create_payment_for_order(order["id"], user_id, total_cents, payment_method, status="paid")
        return CustomerService.get_order(user_id, order["id"])

    @staticmethod
    def get_order(user_id: int, order_id: int) -> Optional[OrderResponse]:
        order = CustomerRepository.get_order_by_id(order_id, user_id)
        if not order:
            return None
        items = CustomerRepository.get_order_items(order_id)
        menu_ids = [i["menu_item_id"] for i in items if i.get("menu_item_id")]
        menu_map = CustomerRepository.get_menu_items_by_ids(menu_ids) if menu_ids else {}
        restaurant = CustomerRepository.get_restaurant_by_id(order["restaurant_id"]) if order.get("restaurant_id") else None
        item_resps = [
            OrderItemResponse(
                id=i["id"],
                order_id=i["order_id"],
                menu_item_id=i.get("menu_item_id"),
                quantity=i["quantity"],
                price_cents=i["price_cents"],
                special_instructions=i.get("special_instructions"),
                name=menu_map.get(i["menu_item_id"], {}).get("name") if i.get("menu_item_id") else None,
            )
            for i in items
        ]
        return OrderResponse(
            id=order["id"],
            user_id=order["user_id"],
            restaurant_id=order.get("restaurant_id"),
            status=order["status"],
            subtotal_cents=order.get("subtotal_cents", 0),
            tax_cents=order.get("tax_cents", 0),
            delivery_fee_cents=order.get("delivery_fee_cents", 0),
            total_cents=order.get("total_cents", 0),
            delivery_address=order.get("delivery_address"),
            created_at=order.get("created_at"),
            updated_at=order.get("updated_at"),
            items=item_resps,
            restaurant_name=restaurant.get("name") if restaurant else None,
        )

    @staticmethod
    def list_orders(user_id: int) -> List[OrderResponse]:
        orders = CustomerRepository.get_orders_by_user_id(user_id)
        result = []
        for o in orders:
            ord_resp = CustomerService.get_order(user_id, o["id"])
            if ord_resp:
                result.append(ord_resp)
        return result

    # ----- Reviews -----
    @staticmethod
    def create_review(
        reviewer_id: int,
        restaurant_id: int,
        rating: int,
        comment: str,
        order_id: Optional[int] = None,
    ) -> Optional[ReviewResponse]:
        row = CustomerRepository.create_review(reviewer_id, restaurant_id, rating, comment, order_id=order_id)
        return ReviewResponse(**row) if row else None

    @staticmethod
    def list_my_reviews(user_id: int) -> List[ReviewResponse]:
        rows = CustomerRepository.get_reviews_by_reviewer_id(user_id)
        return [ReviewResponse(**r) for r in rows]

    # ----- Notifications -----
    @staticmethod
    def list_notifications(user_id: int, limit: int = 50) -> List[NotificationResponse]:
        rows = CustomerRepository.get_notifications_by_user_id(user_id, limit=limit)
        return [NotificationResponse(**r) for r in rows]
