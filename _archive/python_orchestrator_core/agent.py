
import asyncio
import websockets
import json
import platform
import subprocess

async def agent():
    print("Agent started")
    client_id = platform.node()
    uri = f"ws://127.0.0.1:8000/ws/{client_id}"
    print(f"Connecting to {uri}")

    async with websockets.connect(uri) as websocket:
        print(f"Connected to Orchestrator as {client_id}")

        while True:
            data = await websocket.recv()
            message = json.loads(data)
            print(f"Received message: {message}")

            if message.get("command") == "run":
                process = subprocess.Popen(message["payload"], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = process.communicate()
                response = {
                    "status": "completed",
                    "stdout": stdout.decode(),
                    "stderr": stderr.decode()
                }
                await websocket.send_json(response)


if __name__ == "__main__":
    asyncio.run(agent())
