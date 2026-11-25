from collections import defaultdict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["collaboration"])


class RoomManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms[room_id].add(ws)

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        self.rooms[room_id].discard(ws)
        if not self.rooms[room_id]:
            self.rooms.pop(room_id, None)

    async def broadcast(self, room_id: str, sender: WebSocket, message: bytes | str) -> None:
        dead: list[WebSocket] = []
        for client in list(self.rooms.get(room_id, set())):
            if client is sender:
                continue
            try:
                if isinstance(message, bytes):
                    await client.send_bytes(message)
                else:
                    await client.send_text(message)
            except Exception:
                dead.append(client)
        for client in dead:
            self.disconnect(room_id, client)


manager = RoomManager()


@router.websocket("/ws/collab/{diagram_id}")
async def collab_socket(websocket: WebSocket, diagram_id: str):
    """Yjs-compatible binary CRDT & JSON cursor/presence relay (no login required)."""
    await manager.connect(diagram_id, websocket)
    try:
        while True:
            msg = await websocket.receive()
            if "bytes" in msg and msg["bytes"] is not None:
                await manager.broadcast(diagram_id, websocket, msg["bytes"])
            elif "text" in msg and msg["text"] is not None:
                await manager.broadcast(diagram_id, websocket, msg["text"])
    except WebSocketDisconnect:
        manager.disconnect(diagram_id, websocket)
