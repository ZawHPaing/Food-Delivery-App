from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#kssl
from .delivery_signUp import router as delivery_router


app = FastAPI(title="Food Delivery Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
#kssl
app.include_router(delivery_router)


@app.get("/")
def root():
    return {"status": "Backend running"}
