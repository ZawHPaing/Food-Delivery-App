from fastapi import WebSocket
from typing import Dict
import json


class ConnectionManager:
    def __init__(self):
        # Rider connections: user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        # Customer connections: user_id -> WebSocket
        self.customer_connections: Dict[int, WebSocket] = {}
        # Restaurant connections: restaurant_id -> WebSocket
        self.restaurant_connections: Dict[int, WebSocket] = {}

    # ----- Rider connections -----
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"Rider {user_id} connected via WebSocket.")

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"Rider {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(json.dumps(message))
            return True
        return False

    # ----- Customer connections -----
    async def connect_customer(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.customer_connections[user_id] = websocket
        print(f"Customer {user_id} connected via WebSocket.")

    def disconnect_customer(self, user_id: int):
        if user_id in self.customer_connections:
            del self.customer_connections[user_id]
            print(f"Customer {user_id} disconnected.")

    async def send_to_customer(self, user_id: int, message: dict):
        if user_id in self.customer_connections:
            websocket = self.customer_connections[user_id]
            try:
                await websocket.send_text(json.dumps(message))
                return True
            except Exception:
                self.disconnect_customer(user_id)
        return False

    # ----- Restaurant connections -----
    async def connect_restaurant(self, restaurant_id: int, websocket: WebSocket):
        await websocket.accept()
        self.restaurant_connections[restaurant_id] = websocket
        print(f"Restaurant {restaurant_id} connected via WebSocket.")

    def disconnect_restaurant(self, restaurant_id: int):
        if restaurant_id in self.restaurant_connections:
            del self.restaurant_connections[restaurant_id]
            print(f"Restaurant {restaurant_id} disconnected.")

    async def send_to_restaurant(self, restaurant_id: int, message: dict):
        if restaurant_id in self.restaurant_connections:
            websocket = self.restaurant_connections[restaurant_id]
            try:
                await websocket.send_text(json.dumps(message))
                return True
            except Exception:
                self.disconnect_restaurant(restaurant_id)
        return False

    # ----- Broadcast -----
    async def broadcast(self, message: dict):
        for user_id, connection in self.active_connections.items():
            await connection.send_text(json.dumps(message))


# Global instance
manager = ConnectionManager()
