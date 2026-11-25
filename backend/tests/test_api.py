from fastapi.testclient import TestClient
from app.main import app
from app.routers.ai import analyze_python_ast
from app.security.auth import sanitize_svg_or_xml

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["product"] == "Callisto"
    assert body["organization"] == "AkashaVyom Labs"


def test_python_ast_extractor_never_executes_code():
    code = """
class BaseEntity:
    def save(self):
        pass

class User(BaseEntity):
    def authenticate(self):
        return True
"""
    result = analyze_python_ast(code)
    assert len(result["classes"]) == 2
    assert result["classes"][1]["bases"] == ["BaseEntity"]


def test_svg_sanitization_strips_scripts_and_xxe():
    unsafe = '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg onload="alert(1)"><script>alert(2)</script><rect/></svg>'
    cleaned = sanitize_svg_or_xml(unsafe)
    assert "<script" not in cleaned.lower()
    assert "<!doctype" not in cleaned.lower()
    assert "<!entity" not in cleaned.lower()
    assert "onload=" not in cleaned.lower()


def test_diagrams_accessible_without_login():
    res = client.get("/api/v1/diagrams")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
