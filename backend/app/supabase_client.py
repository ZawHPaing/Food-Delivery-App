from supabase import create_client, Client
import config

# Initialize the client
supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)