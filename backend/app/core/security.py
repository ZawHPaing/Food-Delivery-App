from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
from .config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def _truncate_password_to_72(password: str) -> str:
    if password is None:
        return ""
    if not isinstance(password, str):
        password = str(password)
    b = password.encode("utf-8")[:72]
    # decode ignoring partial multi-byte chars at the end
    return b.decode("utf-8", "ignore")

def hash_password(password: str):
    safe = _truncate_password_to_72(password)
    return pwd_context.hash(safe)

def verify_password(password, hashed):
    safe = _truncate_password_to_72(password)
    return pwd_context.verify(safe, hashed)

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Decode and validate JWT; returns payload dict or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to get the current user from JWT token
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """
    Dependency to get current active user (you can add more checks here)
    """
    # You could add additional checks here like:
    # - Check if user exists in database
    # - Check if user is active
    # - Check if email is verified, etc.
    return current_user

def optional_get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Optional authentication - returns None if no valid token
    """
    if credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload:
            return payload
    return None