import stripe
from typing import Optional, Dict, Any
from ..core.config import settings
from ..repositories.customer_repo import CustomerRepository
from ..supabase_client import supabase
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe with your secret key
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Service for handling Stripe payment operations"""

    @staticmethod
    def create_payment_intent(
        order_id: int,
        amount_cents: int,
        user_id: int,
        success_url: str,
        cancel_url: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a Stripe PaymentIntent for an order
        """
        try:
            # Convert cents to dollars/currency unit (Stripe uses smallest currency unit)
            amount_in_currency = amount_cents  # For USD cents, this is correct

            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_in_currency,
                currency="usd",  # Change to your currency
                metadata={
                    "order_id": order_id,
                    "user_id": user_id,
                },
                description=f"Order #{order_id}",
            )

            # Store payment intent in database
            StripeService._store_payment_intent(
                order_id=order_id,
                payment_intent_id=intent.id,
                client_secret=intent.client_secret,
                amount_cents=amount_cents,
                user_id=user_id,
            )

            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "order_id": order_id,
                "amount_cents": amount_cents,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {str(e)}")
            return None

    @staticmethod
    def _store_payment_intent(
        order_id: int,
        payment_intent_id: str,
        client_secret: str,
        amount_cents: int,
        user_id: int,
    ) -> bool:
        """
        Store payment intent in database (optional - for tracking)
        """
        try:
            # You can create a payment_intents table to track this
            # For now, we'll just update the payment record
            supabase.table("payments").update({
                "transaction_id": payment_intent_id,
                "status": "pending",
                "payment_method": "card",
            }).eq("order_id", order_id).eq("user_id", user_id).execute()

            return True
        except Exception as e:
            logger.error(f"Error storing payment intent: {str(e)}")
            return False

    @staticmethod
    def confirm_payment(payment_intent_id: str) -> Optional[Dict[str, Any]]:
        """
        Confirm payment intent (webhook will handle this, but we can check status)
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "metadata": intent.metadata,
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {str(e)}")
            return None

    @staticmethod
    def handle_webhook(payload: bytes, sig_header: str) -> Optional[Dict[str, Any]]:
        """
        Handle Stripe webhook events
        """
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {str(e)}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {str(e)}")
            return None

        # Handle the event
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            StripeService._handle_payment_success(payment_intent)

        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            StripeService._handle_payment_failed(payment_intent)

        return {"status": "success", "type": event["type"]}

    @staticmethod
    def _handle_payment_success(payment_intent: Dict[str, Any]) -> None:
        """
        Handle successful payment - update order status
        """
        try:
            order_id = payment_intent["metadata"].get("order_id")
            if not order_id:
                logger.error("No order_id in payment intent metadata")
                return

            # Update payment status to 'paid'
            supabase.table("payments").update({
                "status": "paid",
                "paid_at": "now()",
            }).eq("transaction_id", payment_intent["id"]).execute()

            logger.info(f"Payment succeeded for order {order_id}")

        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")

    @staticmethod
    def _handle_payment_failed(payment_intent: Dict[str, Any]) -> None:
        """
        Handle failed payment
        """
        try:
            order_id = payment_intent["metadata"].get("order_id")
            if not order_id:
                return

            # Update payment status to 'failed'
            supabase.table("payments").update({
                "status": "failed",
            }).eq("transaction_id", payment_intent["id"]).execute()

            logger.info(f"Payment failed for order {order_id}")

        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")