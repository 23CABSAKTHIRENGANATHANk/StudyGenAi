from supabase import create_client
from ..core.config import settings


class SupabaseService:
    def __init__(self):
        self.client = None
        try:
            service_key = settings.supabase_service_key or settings.supabase_secret_key
            if not settings.supabase_url or not service_key:
                raise RuntimeError("Supabase URL or service key not configured")
            self.client = create_client(settings.supabase_url, service_key)
        except Exception:
            # In test or dev environments the service key might be invalid; defer failures to method calls
            self.client = None

    def upload_file(self, bucket: str, path: str, content: bytes, content_type: str | None = None) -> dict:
        if not self.client:
            raise RuntimeError('Supabase client not configured')
        # Enforce server-side validation on upload path and size
        from ..utils.common import safe_path
        if '..' in path or path.startswith('/') or '\\' in path:
            raise RuntimeError('Invalid storage path')
        file_options = None
        if content_type:
            file_options = {"content-type": content_type}
        try:
            res = self.client.storage.from_(bucket).upload(path, content, file_options)
            return res
        except Exception as e:
            msg = str(e)
            if 'Bucket not found' in msg or (hasattr(e, 'args') and e.args and isinstance(e.args[0], dict) and e.args[0].get('error') == 'Bucket not found'):
                try:
                    self.client.storage.create_bucket(bucket, options={"public": settings.make_storage_public})
                except Exception as ce:
                    raise RuntimeError(f'Bucket missing and creation failed: {ce}')
                res = self.client.storage.from_(bucket).upload(path, content, file_options)
                return res
            raise

    def get_file_url(self, bucket: str, path: str) -> str:
        if not self.client:
            raise RuntimeError('Supabase client not configured')
        # If configured to make storage public, prefer the public URL
        if settings.make_storage_public:
            url = self.client.storage.from_(bucket).get_public_url(path)
            if isinstance(url, dict):
                return url.get('publicURL') or url.get('publicUrl') or ''
            return str(url)

        # Otherwise attempt to create a signed URL with configured expiry
        try:
            res = self.client.storage.from_(bucket).create_signed_url(path, settings.signed_url_expiry)
            if isinstance(res, dict):
                return res.get('signedURL') or res.get('signedUrl') or res.get('signed_url') or ''
            # Some clients may return a tuple or object
            if hasattr(res, 'get') and res.get('signedURL'):
                return res.get('signedURL')
            return str(res)
        except Exception as e:
            # Fallback to public URL if signed URL creation fails
            try:
                url = self.client.storage.from_(bucket).get_public_url(path)
                if isinstance(url, dict):
                    return url.get('publicURL') or url.get('publicUrl') or ''
                return str(url)
            except Exception:
                raise RuntimeError(f'Could not generate URL for {bucket}/{path}: {e}')


supabase_service = SupabaseService()
