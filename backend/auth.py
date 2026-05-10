from fastapi import Header, HTTPException, Depends
from firebase_admin import auth

def verify_firebase_token(authorization: str = Header(None)):
    # 1. Check if header exists
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Missing or invalid Authorization header"
        )

    try:
        # 2. Extract token (Handling 'Bearer <token>')
        token = authorization.split(" ")[1]
        
        # 3. Verify with Firebase
        decoded_token = auth.verify_id_token(token)
        
        # Return the whole dict so app.py can use user["uid"]
        return decoded_token

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
def get_current_user(decoded_token=Depends(verify_firebase_token)):
    return decoded_token