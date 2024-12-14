import serial
import json
import asyncio
import websockets

WEBSOCKET_PORT = 5678

ser = serial.Serial('COM3', 115200)

clients = set()

async def read_serial():
    while True:
        if ser.in_waiting > 0:
            data_line = ser.readline().decode().strip()
            try:
                data = json.loads(data_line)  # Parse the JSON data
                data_json = json.dumps(data)  # Serialize it back to JSON for WebSocket transmission
                await send_to_clients(data_json)
                print("Sent data:", data_json)
            except json.JSONDecodeError:
                print("Received invalid JSON from serial:", data_line)
                
        await asyncio.sleep(0.1)

async def send_to_clients(data_json):
    for websocket in clients.copy():
        try:
            await websocket.send(data_json)
        except websockets.exceptions.ConnectionClosed:
            clients.remove(websocket)

async def handler(websocket, path):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def main():
    start_server = websockets.serve(handler, 'localhost', WEBSOCKET_PORT)
    await asyncio.gather(start_server, read_serial())

asyncio.run(main())
