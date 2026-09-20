import json
import os
import sys

import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore

from pathlib import Path

from dotenv import load_dotenv

# Ruta raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Cargar variables del .env
load_dotenv(BASE_DIR / ".env")

# Always define db (None when Firebase is not configured) so imports never crash.
db = None

try:

    # Credenciales del service account en formato JSON (una sola línea) en .env
    firebase_credentials = os.getenv("FIREBASE_CREDENTIALS", "").strip()

    if not firebase_credentials:
        raise Exception(
            "Firebase no está configurado. "
            "Define la variable 'FIREBASE_CREDENTIALS' en el archivo .env "
            "con el contenido del JSON del service account."
        )

    cred = credentials.Certificate(json.loads(firebase_credentials))

    # Inicializar Firebase una sola vez
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    # Cliente Firestore
    db = firestore.client()

    # Probar conexión
    test = db.collections()

    print("Firebase conectado correctamente", file=sys.stderr)

except Exception as e:

    print("Error conectando Firebase:", file=sys.stderr)
    print(str(e), file=sys.stderr)
    print("db quedara como None (Firebase no disponible).", file=sys.stderr, flush=True)