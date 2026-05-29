import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore

from pathlib import Path


try:

    # Ruta raíz del proyecto
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

    # Ruta al archivo firebase-key.json
    firebase_key_path = BASE_DIR / "firebase-key.json"

    # Verificar si existe
    if not firebase_key_path.exists():
        raise Exception(
            "Firebase no está configurado. "
            "Por favor, coloca 'firebase-key.json' "
            "en el directorio raíz del proyecto."
        )

    # Inicializar Firebase una sola vez
    if not firebase_admin._apps:

        cred = credentials.Certificate(str(firebase_key_path))

        firebase_admin.initialize_app(cred)

    # Cliente Firestore
    db = firestore.client()

    # Probar conexión
    test = db.collections()

    print("🔥 Firebase conectado correctamente")

except Exception as e:

    print("❌ Error conectando Firebase:")
    print(str(e))