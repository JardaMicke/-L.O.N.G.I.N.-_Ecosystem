
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from typing import Dict, List

app = FastAPI()

app.mount("/ui", StaticFiles(directory="longin_ui", html=True), name="ui")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        del self.active_connections[client_id]

    async def send_personal_message(self, data: dict, client_id: str):
        await self.active_connections[client_id].send_json(data)

    async def broadcast(self, data: dict):
        for connection in self.active_connections.values():
            await connection.send_json(data)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    print(f"Agent {client_id} connected.")
    await manager.broadcast({"message": f"Agent {client_id} has joined."})
    try:
        while True:
            try:
                message = await websocket.receive_json()
                print(f"Message from {client_id}: {message}")
            except json.JSONDecodeError:
                data = await websocket.receive_text()
                print(f"Could not decode JSON, received: {data}")
                continue

            if message.get("command") == "run" and client_id.startswith("ui-"):
                if manager.active_connections:
                    # Send to the first agent that is not the UI
                    for agent_id, conn in manager.active_connections.items():
                        if not agent_id.startswith("ui-"):
                            await manager.send_personal_message(message, agent_id)
                            break
            elif not client_id.startswith("ui-"):
                # Broadcast agent responses to all UI clients
                for agent_id, conn in manager.active_connections.items():
                    if agent_id.startswith("ui-"):
                        await manager.send_personal_message(message, agent_id)
            else:
                await manager.broadcast({"message": f"Message from {client_id}: {message}"})

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        print(f"Agent {client_id} disconnected.")
        await manager.broadcast({"message": f"Agent {client_id} has left."})

@app.get("/status")
async def get_status():
    return {"connected_agents": list(manager.active_connections.keys())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
