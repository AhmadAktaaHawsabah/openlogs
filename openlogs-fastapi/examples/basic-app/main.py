from fastapi import FastAPI, HTTPException

from openlogs_fastapi import OpenLogsConfig, OpenLogsLocation, add_openlogs


app = FastAPI(title="OpenLogs FastAPI Basic App")
service = add_openlogs(
    app,
    OpenLogsConfig(
        node_name="demo-api",
        context={"env": "demo"},
        location=OpenLogsLocation(
            latitude=25.2048,
            longitude=55.2708,
            place_country_code="AE",
        ),
    ),
)


@app.get("/")
def hello() -> str:
    return "Hello OpenLogs API!"


@app.get("/error")
def error() -> None:
    raise HTTPException(status_code=500, detail="Something went wrong!")


@app.get("/chain")
def chain() -> list[dict[str, str]]:
    return [
        {
            "id": r.id,
            "hash": r.hash,
            "event": r.entry.event,
            "tps": r.entry.tps,
        }
        for r in service.get_chain()
    ]
