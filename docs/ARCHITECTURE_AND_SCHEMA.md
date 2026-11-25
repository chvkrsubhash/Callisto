# Callisto — Technical Documentation & Feature Report

**Product:** Callisto | **Organization:** AkashaVyom Labs | **Tagline:** *Connect Ideas. Design Systems.*

---

## 1. Diagram Schema & MongoDB Collections

Callisto models every diagram as a multi-page project (`DiagramProject`) with independent pages (`DiagramPage`), layers (`DiagramLayer`), vector nodes (`CallistoNode`), and relationship-aware edges (`CallistoEdge`).

### MongoDB Collections (`backend/app/db/mongodb.py`)
`users`, `workspaces`, `projects`, `diagrams`, `diagram_pages`, `diagram_nodes`, `diagram_edges`, `diagram_layers`, `diagram_groups`, `shape_libraries`, `custom_shapes`, `templates`, `comments`, `permissions`, `revisions`, `media_assets`, `source_documents`, `ai_conversations`, `ai_messages`, `user_preferences`, `audit_logs`.

### Node & Edge Models
- **Node:** `id`, `diagram_id`, `page_id`, `node_type`, `shape_type`, `x`, `y`, `width`, `height`, `rotation`, `layer_id`, `parent_group_id`, `text_content`, `structured_metadata`, `formatting_properties`, `connection_ports`, `locked`, `created_at`, `updated_at`.
- **Edge:** `id`, `diagram_id`, `page_id`, `source_node_id`, `destination_node_id`, `source_port`, `destination_port`, `connector_type`, `relationship_type`, `waypoints`, `labels`, `arrowhead_properties`, `formatting_properties`.

---

## 2. REST & WebSocket API

- `GET /health` — Service health check.
- `POST /api/v1/auth/register` & `POST /api/v1/auth/login` — Argon2/bcrypt password hashing and JWT issuance.
- `GET /api/v1/diagrams`, `POST /api/v1/diagrams`, `GET /api/v1/diagrams/{id}` — Authenticated diagram persistence with RBAC (`owner`, `editor`, `commenter`, `viewer`).
- `POST /api/v1/diagrams/{id}/permissions` — Owner-only permission grants.
- `POST /api/v1/diagrams/{id}/comments` — Commenter+ review comments.
- `POST /api/v1/ai/generate` — Server-side AI proxy for Google Gemini, Groq, OpenRouter, and Ollama.
- `POST /api/v1/ai/analyze-code` — Static Python `ast` extractor (never executes uploaded code).
- `WS /ws/collab/{diagram_id}?token=<jwt>` — Yjs-compatible binary CRDT and JSON presence/cursor relay.
- `GET /api/v1/ecosystem/embed/{diagram_id}?consumer=titan|europa|tejas|rekha|kaala|sabha` — AkashaVyom Labs ecosystem embed endpoint.

---

## 3. Security Architecture

- Passwords hashed with Argon2/bcrypt (`passlib`).
- JWT bearer authentication on all protected REST and WebSocket endpoints.
- Server-side RBAC enforcement (`owner > editor > commenter > viewer`).
- AI provider keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`) are strictly server-side in `backend/.env` and never bundled into the frontend.
- `sanitize_svg_or_xml()` strips `<!DOCTYPE>`, `<!ENTITY>` (XXE), `<script>`, inline `on*=` handlers, and `javascript:` URIs, and enforces `MAX_IMPORT_BYTES`.
- Imported SQL (`parseSQLToERDiagram`) and source code (`analyze_python_ast`, `parseCodeSnippetToDiagram`) are parsed statically and never executed.

---

## 4. Feature Completion & Known Limitations

### Implemented & Verified (Frontend Tests + Production Build)
- Engineering workspace: Top Menu Bar, Main Toolbar, Searchable/Draggable Shape Library (General, Flowchart, Software Engineering, Networking, Cybersecurity, Cloud, UML 2.x, ER, BPMN, Boundaries), XYFlow Canvas, Properties Inspector, Layers, Diagram-as-Code (CodeMirror), Rule-Based Validation, AI Assistant, Comments, Bottom Status Bar.
- Vector Canvas: Infinite & fixed page modes, grid, snap-to-grid, rulers, minimap, resize, rotate, group/ungroup, lock/unlock, z-order, align (6-way), distribute, match dimensions, 60-step undo/redo, clipboard, keyboard shortcuts.
- Structured Editors: UML Class attribute/method editor; ER Table column/PK/FK/dialect editor (PostgreSQL, MySQL, SQLite, MSSQL, MongoDB).
- Engines: Dagre & ELK.js automatic layouts; SQL DDL generation & `CREATE TABLE` parser; Mermaid/PlantUML/DOT/JSON export & Mermaid/DOT import; SVG, PNG, JPEG, Multi-page PDF, Draw.io XML, and ZIP export; IndexedDB offline persistence.

### Known Limitations
- **Python Backend Execution:** The `backend/` FastAPI codebase and `backend/tests/test_api.py` were authored cleanly, but Python 3 is not installed in the current Windows environment, so `pytest` and live `uvicorn` execution were not run locally.
- **VSDX (Visio) & Full BPMN 2.0:** Microsoft Visio `.vsdx` binary/XML import and full BPMN 2.0 XML round-trip are scoped as optional future extensions.
- **Live Multiplayer:** The Yjs-compatible WebSocket relay (`backend/app/routers/collab.py`) requires running the FastAPI backend; when offline, Callisto operates in single-user local IndexedDB mode.

