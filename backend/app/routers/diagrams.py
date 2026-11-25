import uuid
from fastapi import APIRouter, Cookie, HTTPException
from ..db.mongodb import mongo
from ..models.schemas import (
    CommentCreate,
    DiagramProjectPayload,
    utc_now,
)

router = APIRouter(prefix="/api/v1", tags=["diagrams"])


def _workspace_owner(callisto_workspace: str | None) -> str:
    return callisto_workspace or "local-workspace"


@router.get("/diagrams")
async def list_diagrams(callisto_workspace: str | None = Cookie(default=None)):
    if mongo.db is None:
        return []
    owner_id = _workspace_owner(callisto_workspace)
    cursor = mongo.db["diagrams"].find(
        {"owner_id": owner_id, "trashed": {"$ne": True}}, {"_id": 0}
    )
    return await cursor.to_list(length=200)


@router.post("/diagrams")
async def save_diagram(
    payload: DiagramProjectPayload,
    callisto_workspace: str | None = Cookie(default=None),
):
    if mongo.db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    owner_id = _workspace_owner(callisto_workspace)
    existing = await mongo.db["diagrams"].find_one({"id": payload.id})

    doc = {
        "id": payload.id,
        "name": payload.name,
        "folder": payload.folder,
        "diagramType": payload.diagramType,
        "activePageId": payload.activePageId,
        "owner_id": existing["owner_id"] if existing else owner_id,
        "updated_at": utc_now(),
        "created_at": existing["created_at"] if existing else utc_now(),
        "pages": [pg.model_dump() for pg in payload.pages],
    }
    await mongo.db["diagrams"].update_one({"id": payload.id}, {"$set": doc}, upsert=True)
    return {"status": "saved", "id": payload.id, "updated_at": doc["updated_at"]}


@router.get("/diagrams/{diagram_id}")
async def get_diagram(diagram_id: str):
    if mongo.db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    diag = await mongo.db["diagrams"].find_one({"id": diagram_id}, {"_id": 0})
    if not diag:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return diag


@router.post("/diagrams/{diagram_id}/comments")
async def add_comment(diagram_id: str, payload: CommentCreate):
    if mongo.db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    comment = {
        "id": f"cmt_{uuid.uuid4().hex[:10]}",
        "diagram_id": diagram_id,
        "page_id": payload.page_id,
        "node_id": payload.node_id,
        "author_id": "workspace-user",
        "text": payload.text,
        "resolved": False,
        "created_at": utc_now(),
    }
    await mongo.db["comments"].insert_one(comment)
    comment.pop("_id", None)
    return comment


@router.get("/ecosystem/embed/{diagram_id}")
async def ecosystem_embed_metadata(diagram_id: str, consumer: str = "titan"):
    """Unified integration endpoint for Titan, Europa, Tejas, Rekha, Kaala, and Sabha."""
    if mongo.db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    diag = await mongo.db["diagrams"].find_one({"id": diagram_id}, {"_id": 0})
    if not diag:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return {
        "product": "Callisto",
        "organization": "AkashaVyom Labs",
        "consumer": consumer,
        "diagram": diag,
    }
