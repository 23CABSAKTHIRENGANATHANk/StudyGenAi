from importlib.machinery import SourceFileLoader
from pathlib import Path

EXTRACTION_PATH = Path(__file__).resolve().parents[1] / 'app' / 'utils' / 'extraction.py'
extraction = SourceFileLoader('extraction', str(EXTRACTION_PATH)).load_module()
extract_text_from_bytes = extraction.extract_text_from_bytes


def test_extract_text_from_txt():
    data = b"Hello world\nThis is a test"
    text = extract_text_from_bytes(data, "notes.txt")
    assert "Hello world" in text

# Note: PDF/DOCX/PPTX parsing tests require sample files; skip in CI by default
