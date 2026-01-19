from fastapi import FastAPI

app = FastAPI(title="Food Delivery Backend")

@app.get("/")
def root():
    return {"status": "Backend running"}
