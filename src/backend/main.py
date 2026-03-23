"""
Main FastAPI application.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
import os

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title=os.getenv("APP_NAME", "Pomodoro TMS"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="Task Management System with integrated Pomodoro timer"
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from api.auth import router as auth_router
from api.tasks import router as tasks_router
from api.lists import router as lists_router
from api.statuses import router as statuses_router
from api.projects import router as projects_router
from api.clients import router as clients_router
from api.intervals import router as intervals_router
from api.timer import router as timer_router
from api.time_segments import router as time_segments_router
from api.smart import router as smart_router
from api.analytics import router as analytics_router
from api.settings import router as settings_router

app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(lists_router)
app.include_router(statuses_router)
app.include_router(projects_router)
app.include_router(clients_router)
app.include_router(intervals_router)
app.include_router(timer_router)
app.include_router(time_segments_router)
app.include_router(smart_router)
app.include_router(analytics_router)
app.include_router(settings_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Pomodoro TMS API",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Validation error"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "message": "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
