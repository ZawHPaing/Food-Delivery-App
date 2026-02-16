from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import delivery_routes, auth_routes, admin_users_routes

app = FastAPI(title="Food Delivery Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(delivery_routes.router)  # /delivery/*
app.include_router(auth_routes.router)      # /auth/*
app.include_router(admin_users_routes.router)

@app.get("/")
def root():
    return {"status": "Backend running"}