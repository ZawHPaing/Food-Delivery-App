from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from .config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
