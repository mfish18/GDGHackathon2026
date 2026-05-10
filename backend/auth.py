from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth

_bearer = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(_bearer)):
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
def get_current_user(decoded_token=Depends(verify_firebase_token)):
    return decoded_token