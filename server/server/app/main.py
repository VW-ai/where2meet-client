"""Main FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import events, participants, candidates, votes, sse, auth, feed

# Create FastAPI app
app = FastAPI(
    title="Where2Meet API",
    description="Backend API for Where2Meet - A location coordination platform",
    version="0.3.0",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(events.router, prefix="/api/v1", tags=["events"])
app.include_router(participants.router, prefix="/api/v1", tags=["participants"])
app.include_router(candidates.router, prefix="/api/v1", tags=["candidates"])
app.include_router(votes.router, prefix="/api/v1", tags=["votes"])
app.include_router(sse.router, prefix="/api/v1", tags=["sse"])
app.include_router(feed.router, prefix="/api/v1", tags=["event-feed"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Where2Meet API",
        "version": "0.2.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# M2-10: Structured logging setup
import structlog
import logging

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Get structured logger
log = structlog.get_logger()


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    log.info("where2meet_api_startup", environment=settings.ENVIRONMENT)


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    log.info("where2meet_api_shutdown")
