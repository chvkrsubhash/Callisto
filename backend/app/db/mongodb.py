from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from ..config import settings

COLLECTIONS = [
    "users",
    "workspaces",
    "projects",
    "diagrams",
    "diagram_pages",
    "diagram_nodes",
    "diagram_edges",
    "diagram_layers",
    "diagram_groups",
    "shape_libraries",
    "custom_shapes",
    "templates",
    "comments",
    "permissions",
    "revisions",
    "media_assets",
    "source_documents",
    "ai_conversations",
    "ai_messages",
    "user_preferences",
    "audit_logs",
]


class MongoManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client[settings.mongodb_db_name]
        await self._ensure_indexes()

    async def close(self) -> None:
        if self.client is not None:
            self.client.close()

    async def _ensure_indexes(self) -> None:
        if self.db is None:
            return
        await self.db["users"].create_index("email", unique=True)
        await self.db["diagrams"].create_index([("owner_id", 1), ("updated_at", -1)])
        await self.db["diagram_nodes"].create_index([("diagram_id", 1), ("page_id", 1)])
        await self.db["diagram_edges"].create_index([("diagram_id", 1), ("page_id", 1)])
        await self.db["permissions"].create_index([("diagram_id", 1), ("user_id", 1)])
        await self.db["audit_logs"].create_index([("workspace_id", 1), ("created_at", -1)])


mongo = MongoManager()

