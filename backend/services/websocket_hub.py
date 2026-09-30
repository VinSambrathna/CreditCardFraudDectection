"""
SentinelPay - Real-Time Push Hub (FastAPI WebSocket)
Distributes fraud alerts and state machine mutation events to connected
analyst portals and operations consoles with sub-second latency.
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import WebSocket

class WebSocketConnection:
    def __init__(self, websocket: WebSocket, institution_id: Optional[int] = None):
        self.websocket = websocket
        self.institution_id = institution_id

class AlertHub:
    _instance = None

    def __init__(self):
        self.connections: List[WebSocketConnection] = []

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def connect(self, websocket: WebSocket, institution_id: Optional[int] = None):
        await websocket.accept()
        conn = WebSocketConnection(websocket, institution_id)
        self.connections.append(conn)
        print(f"[WS] Client connected. Total active connections: {len(self.connections)} (Scoped: {institution_id})")

    def disconnect(self, websocket: WebSocket):
        self.connections = [c for c in self.connections if c.websocket != websocket]
        print(f"[WS] Client disconnected. Total active connections: {len(self.connections)}")

    async def broadcast_alert(
        self,
        event_type: str,
        payload: Dict[str, Any],
        institution_id: Optional[int] = None
    ):
        """
        Broadcasts an alert event to connected clients.
        If institution_id is specified, clients scoped to that institution or unscoped receive the event.
        """
        message = {
            "event": event_type,
            "institution_id": institution_id,
            "data": payload
        }
        dead_connections = []
        for conn in self.connections:
            # If client scoped to an institution, only send their events
            if conn.institution_id is not None and institution_id is not None:
                if conn.institution_id != institution_id:
                    continue

            try:
                await conn.websocket.send_json(message)
            except Exception:
                dead_connections.append(conn)

        for dead in dead_connections:
            if dead in self.connections:
                self.connections.remove(dead)
