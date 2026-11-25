from datetime import datetime, timezone
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


Role = Literal["owner", "editor", "commenter", "viewer"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class DiagramNodeModel(BaseModel):
    id: str
    diagram_id: str
    page_id: str
    node_type: str = "callisto"
    shape_type: str
    x: float
    y: float
    width: float = 140
    height: float = 72
    rotation: float = 0
    layer_id: str = "default"
    parent_group_id: Optional[str] = None
    text_content: str = ""
    structured_metadata: dict[str, Any] = Field(default_factory=dict)
    formatting_properties: dict[str, Any] = Field(default_factory=dict)
    connection_ports: list[str] = Field(default_factory=lambda: ["top", "right", "bottom", "left"])
    locked: bool = False
    created_at: str = Field(default_factory=utc_now)
    updated_at: str = Field(default_factory=utc_now)


class DiagramEdgeModel(BaseModel):
    id: str
    diagram_id: str
    page_id: str
    source_node_id: str
    destination_node_id: str
    source_port: Optional[str] = None
    destination_port: Optional[str] = None
    connector_type: str = "orthogonal"
    relationship_type: Optional[str] = None
    waypoints: list[dict[str, float]] = Field(default_factory=list)
    labels: dict[str, str] = Field(default_factory=dict)
    arrowhead_properties: dict[str, str] = Field(default_factory=dict)
    formatting_properties: dict[str, Any] = Field(default_factory=dict)


class DiagramPagePayload(BaseModel):
    id: str
    name: str
    diagramType: str = "generic"
    canvasMode: Literal["infinite", "fixed"] = "infinite"
    pageWidth: int = 1123
    pageHeight: int = 794
    orientation: Literal["landscape", "portrait"] = "landscape"
    background: str = "#FFFFFF"
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    layers: list[dict[str, Any]] = Field(default_factory=list)
    activeLayerId: str = "default"


class DiagramProjectPayload(BaseModel):
    id: str
    name: str
    folder: str = "General"
    diagramType: str = "generic"
    pages: list[DiagramPagePayload] = Field(default_factory=list)
    activePageId: str = ""


class PermissionGrant(BaseModel):
    user_email: str
    role: Role


class CommentCreate(BaseModel):
    page_id: str
    node_id: Optional[str] = None
    text: str = Field(min_length=1, max_length=2000)


class AIGenerateRequest(BaseModel):
    prompt: str = Field(min_length=2, max_length=4000)
    provider: Literal["gemini", "groq", "openrouter", "ollama"] = "gemini"
    context_nodes: list[dict[str, Any]] = Field(default_factory=list)


class CodeAnalyzeRequest(BaseModel):
    language: Literal["python", "typescript", "javascript", "java", "csharp", "sql"]
    source_code: str = Field(min_length=1, max_length=100_000)

