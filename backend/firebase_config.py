import os
import json
import firebase_admin

from firebase_admin import credentials


def firebase_init():
    """
    Initialize Firebase Admin SDK once.
    Works locally and in Railway deployment.
    """

    # Prevent duplicate initialization
    if firebase_admin._apps:
        return

    # Production / Railway
    if os.getenv("FIREBASE_CONFIG"):

        firebase_json = json.loads(
            os.environ["FIREBASE_CONFIG"]
        )

        cred = credentials.Certificate(firebase_json)

    # Local development fallback
    else:

        cred = credentials.Certificate(
            "firebase-service-account.json"
        )

    firebase_admin.initialize_app(cred)

    print("Firebase initialized.")