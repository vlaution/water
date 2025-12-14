from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.services.realtime.realtime_service import manager
import json

router = APIRouter(tags=["realtime"])

@router.websocket("/ws/market-data")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data.
    Clients connect here to receive live updates.
    """
    print(f"WebSocket connection attempt from {websocket.client}")
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for any client messages (optional)
            # In this push-based model, we primarily send data TO the client.
            data = await websocket.receive_text()
            
            # Echo or process if needed (e.g., subscription requests)
            # For now, just acknowledge heartbeats if implemented
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
            except:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
