from fastapi import WebSocket
from typing import Dict
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}  # Rider: user_id -> WebSocket
        self.customer_connections: Dict[int, WebSocket] = {}  # Customer: user_id -> WebSocket
        self.restaurant_connections: Dict[int, WebSocket] = {}  # Restaurant: restaurant_id -> WebSocket

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: int) -> bool:
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(json.dumps(message))
            return True
        return False

    async def connect_customer(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.customer_connections[user_id] = websocket

    def disconnect_customer(self, user_id: int):
        self.customer_connections.pop(user_id, None)

    async def send_to_customer(self, user_id: int, message: dict) -> bool:
        if user_id in self.customer_connections:
            try:
                await self.customer_connections[user_id].send_text(json.dumps(message))
                return True
            except Exception:
                self.disconnect_customer(user_id)
        return False

    async def connect_restaurant(self, restaurant_id: int, websocket: WebSocket):
        await websocket.accept()
        self.restaurant_connections[restaurant_id] = websocket

    def disconnect_restaurant(self, restaurant_id: int):
        self.restaurant_connections.pop(restaurant_id, None)

    async def send_to_restaurant(self, restaurant_id: int, message: dict) -> bool:
        if restaurant_id in self.restaurant_connections:
            try:
                await self.restaurant_connections[restaurant_id].send_text(json.dumps(message))
                return True
            except Exception:
                self.disconnect_restaurant(restaurant_id)
        return False


manager = ConnectionManager()
