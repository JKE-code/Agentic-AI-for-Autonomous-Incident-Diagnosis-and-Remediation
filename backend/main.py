import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.database import init_db, SessionLocal
from backend.services.incident_service import seed_initial_incidents
from backend.services.ai_client import check_ai_health
from backend.schemas.api_models import HealthResponse

from backend.api.incidents import router as incidents_router
from backend.api.diagnosis import router as diagnosis_router
from backend.api.approvals import router as approvals_router
from backend.api.remediation import router as remediation_router
from backend.api.audit import router as audit_router
from backend.api.evaluation import router as evaluation_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend.main")

# Initialize SQLite database schema
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_initial_incidents(db)
    finally:
        db.close()
    yield
    logger.info("Backend service shutting down.")

app = FastAPI(
    title="Autonomous Incident Diagnosis & Remediation Backend",
    description="Integration API for Incident Management, AI Diagnosis, Sandbox Execution & Audit Trails",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite default port 5173 and standard localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(incidents_router)
app.include_router(diagnosis_router)
app.include_router(approvals_router)
app.include_router(remediation_router)
app.include_router(audit_router)
app.include_router(evaluation_router)

@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    ai_available = await check_ai_health()
    return HealthResponse(
        status="UP",
        service="incident-remediation-backend",
        version="1.0.0",
        ai_service_available=ai_available
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
