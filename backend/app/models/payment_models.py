from pydantic import BaseModel
from typing import Optional, List


class CreatePaymentIntentRequest(BaseModel):
    order_id: int
    payment_method: str = "card"
    success_url: str
    cancel_url: str


class CreatePaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    order_id: int
    amount_cents: int


class StripeWebhookEvent(BaseModel):
    id: str
    type: str
    data: dict


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str
    order_id: int


class PaymentConfirmResponse(BaseModel):
    success: bool
    order_id: int
    status: str
    message: str