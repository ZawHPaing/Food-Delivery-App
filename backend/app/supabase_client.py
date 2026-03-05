import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from the app directory (where the file lives)
#_env_path = Path(__file__).resolve().parent / ".env"
#load_dotenv(_env_path)

load_dotenv()  # automatically finds backend/.env

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Debug print
print(f"URL: {SUPABASE_URL}")
print(f"Key starts with: {SUPABASE_KEY[:10] if SUPABASE_KEY else 'None'}...")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY is not set")

# Initialize the client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)