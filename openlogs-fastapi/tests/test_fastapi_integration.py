from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from openlogs_fastapi import OpenLogsConfig, add_openlogs


def test_middleware_logs_success_and_error_requests() -> None:
    app = FastAPI()
    service = add_openlogs(app, OpenLogsConfig(node_name="demo-api", context={"env": "test"}))

    @app.get("/")
    def root() -> str:
        return "Hello OpenLogs API!"

    @app.get("/error")
    def error() -> None:
        raise HTTPException(status_code=500, detail="Something went wrong!")

    client = TestClient(app)

    ok = client.get("/")
    fail = client.get("/error")

    assert ok.status_code == 200
    assert fail.status_code == 500

    events = [r.entry.event for r in service.get_chain()]
    assert "http.request.success" in events
    assert "http.request.failed" in events
