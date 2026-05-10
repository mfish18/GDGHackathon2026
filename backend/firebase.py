import os
import json
import firebase_admin

from firebase_admin import credentials

firebase_json = json.loads(
    os.environ["FIREBASE_CONFIG"]
)

cred = credentials.Certificate(firebase_json)

firebase_admin.initialize_app(cred)