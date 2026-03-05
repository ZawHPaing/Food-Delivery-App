from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional
import logging
import traceback

from ..models.payment_models import (
    CreatePaymentIntentRequest,
    CreatePaymentIntentResponse,
    ConfirmPaymentRequest,
    PaymentConfirmResponse,
)
from ..services.stripe_service import StripeService
from ..services.customer_service import CustomerService
from ..core.security import get_current_active_user  # Import this instead

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/create-payment-intent", response_model=CreatePaymentIntentResponse)
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    current_user: dict = Depends(get_current_active_user),  # Use the existing dependency
):
    """
    Create a Stripe PaymentIntent for an order
    """
    user_id = current_user.get("user_id")
    logger.info(f"Creating payment intent for order {request.order_id}, user {user_id}")
    
    try:
        # Verify order belongs to user and get amount
        order = CustomerService.get_order(user_id, request.order_id)
        if not order:
            logger.error(f"Order {request.order_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Order not found")
        
        logger.info(f"Order found: total_cents={order.total_cents}")

        # Create payment intent
        result = StripeService.create_payment_intent(
            order_id=request.order_id,
            amount_cents=order.total_cents,
            user_id=user_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )

        if not result:
            logger.error("Stripe service returned None")
            raise HTTPException(status_code=400, detail="Failed to create payment intent")

        logger.info(f"Payment intent created successfully: {result.get('payment_intent_id')}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/confirm-payment", response_model=PaymentConfirmResponse)
async def confirm_payment(
    request: ConfirmPaymentRequest,
    current_user: dict = Depends(get_current_active_user),  # Use the existing dependency
):
    """
    Confirm payment after successful Stripe payment
    """
    user_id = current_user.get("user_id")
    logger.info(f"Confirming payment for order {request.order_id}, payment intent {request.payment_intent_id}")
    
    try:
        # Verify order belongs to user
        order = CustomerService.get_order(user_id, request.order_id)
        if not order:
            logger.error(f"Order {request.order_id} not found for user {user_id}")
            raise HTTPException(status_code=404, detail="Order not found")

        logger.info(f"Payment confirmed for order {request.order_id}")
        
        return PaymentConfirmResponse(
            success=True,
            order_id=request.order_id,
            status="paid",
            message="Payment confirmed successfully",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming payment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint for payment events (no auth required)
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    result = StripeService.handle_webhook(payload, sig_header)

    if not result:
        raise HTTPException(status_code=400, detail="Webhook error")

    return result