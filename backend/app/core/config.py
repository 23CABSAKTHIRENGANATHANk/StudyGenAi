from dataclasses import dataclass, field
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

    @property
    def allowed_origins(self) -> list[str]:
        """Return all allowed CORS origins from APP_ORIGIN (comma-separated) plus localhost."""
        base = [o.strip() for o in self.app_origin.split(',') if o.strip()]
        # Always allow local dev
        extras = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
        seen: set[str] = set()
        result: list[str] = []
        for o in base + extras:
            if o not in seen:
                seen.add(o)
                result.append(o)
        return result
    # Modern Gemini models (REST API v1beta)
    gemini_embed_model: str = os.getenv('GEMINI_EMBED_MODEL', 'text-embedding-004')
    gemini_chat_model: str = os.getenv('GEMINI_CHAT_MODEL', 'gemini-2.0-flash')
    # Storage access strategy: if true, created buckets will be public and
    # `get_file_url` will return a public URL. Otherwise signed URLs are preferred.
    make_storage_public: bool = os.getenv('MAKE_STORAGE_PUBLIC', 'false').lower() == 'true'
    # Default signed URL expiry (seconds) when returning temporary links
    signed_url_expiry: int = int(os.getenv('SIGNED_URL_EXPIRY', '3600'))

settings = Settings()
