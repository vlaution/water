from fastapi import WebSocket
from typing import List, Dict
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        # Store active connections
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Client connected. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        """Removes a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"Client disconnected. Total connections: {len(self.active_connections)}")
            
    async def broadcast(self, message: Dict):
        """Sends a message to all connected clients."""
        if not self.active_connections:
            return
            
        disconnected_clients = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message: {e}")
                disconnected_clients.append(connection)
                
        # Clean up stale connections
        for dead_connection in disconnected_clients:
            self.disconnect(dead_connection)

    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Sends a message to a specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
            self.disconnect(websocket)

# Global Manager Instance
manager = WebSocketManager()
