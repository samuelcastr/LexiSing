import json, os, sys, firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
from dotenv import load_dotenv
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
db = None
firebase_admin_app = None
try:
    cred_json = os.getenv("FIREBASE_CREDENTIALS", "").strip()
    if cred_json:
        cred = credentials.Certificate(json.loads(cred_json))
        if not firebase_admin._apps: firebase_admin_app = firebase_admin.initialize_app(cred)
        db = firestore.client()
except Exception as e: print(f"Firebase error: {e}")
