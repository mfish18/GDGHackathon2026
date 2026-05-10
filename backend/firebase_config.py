import firebase_admin
from firebase_admin import credentials

def firebase_init():
    """
    Initializes the Firebase Admin SDK using the service account key.
    """
    if not firebase_admin._apps:
        # Load credentials
        cred = credentials.Certificate("firebase-service-account.json")
        
        # Initialize the app
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized.")
    else:
        print("Firebase already initialized, skipping.")