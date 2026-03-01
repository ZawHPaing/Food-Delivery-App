from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.requests import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.routes import delivery_routes, auth_routes, admin_users_routes, customer_routes, admin_menu_routes, admin_restaurant_routes, discovery_routes, menu_routes, restaurant_routes, consumer_routes
import os

# Allowed frontend origins for CORS - Add your server IP
CORS_ORIGINS = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://192.168.1.100:3000",  # Replace with your actual server IP
    "http://your-domain.com",      # Add your domain if you have one
]

# You can also allow all origins for development (not recommended for production)
# CORS_ORIGINS = ["*"]

app = FastAPI(title="Food Delivery Backend")

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
    return {"Access-Control-Allow-Origin": CORS_ORIGINS[0] if CORS_ORIGINS else "*"}


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
app.include_router(discovery_routes.router)  # /restaurants (public, no auth)
app.include_router(consumer_routes.router)   # /consumer/*
app.include_router(delivery_routes.router)   # /delivery/*
app.include_router(auth_routes.router)       # /auth/*
app.include_router(admin_users_routes.router)
app.include_router(customer_routes.router)   # /customer/*
app.include_router(admin_menu_routes.router)  # /menu/*
app.include_router(admin_restaurant_routes.router)
app.include_router(menu_routes.router)       # /restaurant/menus/*
app.include_router(restaurant_routes.router)  # /restaurant/orders, /restaurant/ws/* # /admin/restaurants/*

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "cors_origins": CORS_ORIGINS}

# After all routers are included
@app.on_event("startup")
async def startup_event():
    print("\n" + "=" * 80)
    print("ALL REGISTERED ROUTES:")
    print("=" * 80)
    for route in app.routes:
        print(f"Path: {route.path}, Methods: {route.methods}, Name: {route.name}")
    print("=" * 80 + "\n")