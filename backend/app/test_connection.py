from supabase_client import supabase

try:
    # Try a simple query
    response = supabase.table("USERS").select("*").limit(1).execute()
    print("Connection successful!")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Connection failed: {e}")