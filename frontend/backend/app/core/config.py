from dataclasses import dataclass
from dotenv import load_dotenv
import os

load_dotenv()

@dataclass
class Settings:
    supabase_url: str = os.getenv('SUPABASE_URL', '')
    supabase_service_key: str = os.getenv('SUPABASE_SERVICE_KEY', '')
    supabase_secret_key: str = os.getenv('SUPABASE_SECRET_KEY', '')
    supabase_anon_key: str = os.getenv('SUPABASE_ANON_KEY', '')
    database_url: str = os.getenv('DATABASE_URL', '')
    google_gemini_api_key: str = os.getenv('GOOGLE_GEMINI_API_KEY', '')
    app_origin: str = os.getenv('APP_ORIGIN', 'http://localhost:5173')
    dev_cors_all: bool = os.getenv('DEV_CORS_ALL', 'false').lower() == 'true'
    # Modern Gemini models (REST API v1beta)
    gemini_embed_model: str = os.getenv('GEMINI_EMBED_MODEL', 'text-embedding-004')
    gemini_chat_model: str = os.getenv('GEMINI_CHAT_MODEL', 'gemini-2.0-flash')
    # Storage access strategy: if true, created buckets will be public and
    # `get_file_url` will return a public URL. Otherwise signed URLs are preferred.
    make_storage_public: bool = os.getenv('MAKE_STORAGE_PUBLIC', 'false').lower() == 'true'
    # Default signed URL expiry (seconds) when returning temporary links
    signed_url_expiry: int = int(os.getenv('SIGNED_URL_EXPIRY', '3600'))

settings = Settings()
