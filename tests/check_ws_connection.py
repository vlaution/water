
import asyncio
import websockets
import sys

async def test_connection():
    uri = "ws://localhost:8000/ws/market-data"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            await websocket.send('{"type": "ping"}')
            response = await websocket.recv()
            print(f"Received: {response}")
            return True
    except ConnectionRefusedError:
        print("Connection Refused. Is the server running?")
        return False
    except Exception as e:
        print(f"Connection Failed: {e}")
        return False

if __name__ == "__main__":
    # Check if websockets is installed
    try:
        import websockets
    except ImportError:
        print("websockets library not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
        import websockets

    try:
        success = asyncio.run(test_connection())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        pass
