from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.routes import delivery_routes, auth_routes, admin_users_routes, customer_routes, consumer_routes, admin_restaurants_routes, menu_routes
import os

# Allowed frontend origins for CORS
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

app = FastAPI(title="Food Delivery Backend")

# Serve uploaded images
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "menu_items"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# CORS – add first so it wraps all responses including errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def _cors_headers(origin) -> dict:
    if origin and origin in CORS_ORIGINS:
        return {"Access-Control-Allow-Origin": origin}
    return {"Access-Control-Allow-Origin": CORS_ORIGINS[0]}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    origin = request.headers.get("origin")
    headers = _cors_headers(origin)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail} if isinstance(exc.detail, str) else {"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    origin = request.headers.get("origin")
    headers = _cors_headers(origin)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=headers,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are present on 500 and any unhandled errors."""
    import traceback
    traceback.print_exc()
    origin = request.headers.get("origin")
    headers = _cors_headers(origin)
    detail = "Internal server error"
    try:
        detail = str(exc)
    except Exception:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": detail},
        headers=headers,
    )


# Include routers
app.include_router(delivery_routes.router)   # /delivery/*
app.include_router(auth_routes.router)       # /auth/*
app.include_router(admin_users_routes.router)
app.include_router(customer_routes.router)   # /customer/*
app.include_router(consumer_routes.router)   # /consumer/*
app.include_router(admin_restaurants_routes.router) # /restaurant/*
app.include_router(menu_routes.router)

@app.get("/")
def root():
    return {"status": "Backend running"}
