#!/usr/bin/env python
"""
StudyGen AI Backend - Diagnostic & Auto-Fix Tool
Checks and fixes common issues before starting the backend
"""

import os
import sys
import subprocess
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_section(title):
    print(f"\n{BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{RESET}\n")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")

def check_python():
    """Check Python version"""
    print_section("1. Checking Python")
    version = sys.version_info
    print(f"Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major >= 3 and version.minor >= 10:
        print_success(f"Python version {version.major}.{version.minor} is supported")
        return True
    else:
        print_error(f"Python 3.10+ required, found {version.major}.{version.minor}")
        return False

def check_venv():
    """Check if virtual environment exists"""
    print_section("2. Checking Virtual Environment")
    venv_path = Path("venv")
    
    if venv_path.exists():
        print_success("Virtual environment found")
        return True
    else:
        print_warning("Virtual environment not found, will create it")
        return False

def create_venv():
    """Create virtual environment"""
    print_section("3. Creating Virtual Environment")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print_success("Virtual environment created")
        return True
    except Exception as e:
        print_error(f"Failed to create virtual environment: {e}")
        return False

def get_pip_command():
    """Get the pip command for current environment"""
    if sys.platform == "win32":
        return "venv\\Scripts\\pip.exe"
    else:
        return "venv/bin/pip"

def install_dependencies():
    """Install Python dependencies"""
    print_section("4. Installing Dependencies")
    pip_cmd = get_pip_command()
    
    if not Path(pip_cmd).exists():
        print_error(f"pip not found at {pip_cmd}")
        return False
    
    try:
        print("Installing from requirements.txt...")
        subprocess.run([pip_cmd, "install", "-q", "-r", "requirements.txt"], check=True)
        print_success("Dependencies installed")
        return True
    except Exception as e:
        print_error(f"Failed to install dependencies: {e}")
        print_warning("Try running manually: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists"""
    print_section("5. Checking Environment Configuration")
    env_path = Path(".env")
    
    if env_path.exists():
        print_success(".env file found")
        
        # Check key variables
        with open(env_path) as f:
            content = f.read()
            
        if "DATABASE_URL" in content:
            print_success("DATABASE_URL is configured")
        else:
            print_warning("DATABASE_URL not found in .env")
            
        if "SUPABASE_URL" in content:
            print_success("SUPABASE_URL is configured")
        else:
            print_warning("SUPABASE_URL not found in .env")
            
        return True
    else:
        print_error(".env file not found")
        print_warning("Please create backend/.env with required variables")
        return False

def test_imports():
    """Test if main modules can be imported"""
    print_section("6. Testing Module Imports")
    
    # Add current directory to path
    sys.path.insert(0, str(Path.cwd()))
    
    try:
        from app.core.config import settings
        print_success("Config module loaded")
        
        from app.main import app
        print_success("FastAPI app loaded")
        
        from app.db import get_connection
        print_success("Database module loaded")
        
        from app.services.supabase_service import supabase_service
        print_success("Supabase service loaded")
        
        return True
    except Exception as e:
        print_error(f"Failed to import modules: {e}")
        import traceback
        print(f"{RED}{traceback.format_exc()}{RESET}")
        return False

def check_database():
    """Test database connectivity"""
    print_section("7. Testing Database Connection")
    
    try:
        import psycopg
        from app.core.config import settings
        
        if not settings.database_url:
            print_error("DATABASE_URL not configured")
            return False
        
        print(f"Attempting to connect to database...")
        print(f"Connection string: {settings.database_url.split('@')[0]}@...")
        
        # Try to connect
        conn = psycopg.connect(settings.database_url)
        
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            result = cur.fetchone()
            
        conn.close()
        
        print_success("Database connection successful")
        return True
        
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        print_warning("Make sure PostgreSQL is running")
        print_warning("Check DATABASE_URL in .env")
        return False

def main():
    print(f"\n{BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     StudyGen AI Backend - Diagnostic & Auto-Fix Tool      ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{RESET}")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    checks = [
        ("Python Version", check_python),
        ("Virtual Environment", check_venv),
        ("Create venv if needed", lambda: create_venv() if not check_venv() else True),
        ("Dependencies", install_dependencies),
        ("Environment File", check_env_file),
        ("Module Imports", test_imports),
        ("Database Connection", check_database),
    ]
    
    passed = 0
    failed = 0
    
    for name, check_func in checks:
        try:
            if check_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print_error(f"Error during {name}: {e}")
            failed += 1
    
    print_section("Diagnostic Summary")
    print(f"Passed: {GREEN}{passed}{RESET}")
    print(f"Failed: {RED}{failed}{RESET}")
    
    if failed == 0:
        print(f"\n{GREEN}✓ All checks passed! Backend is ready to start.{RESET}")
        print(f"\nRun the backend with:")
        print(f"  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return 0
    else:
        print(f"\n{RED}✗ Some checks failed. Please fix the issues above.{RESET}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
