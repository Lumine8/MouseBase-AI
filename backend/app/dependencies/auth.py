from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.models.project import Project
from app.services.auth_service import AuthService
from app.exceptions.auth import InvalidAPIKeyError

security = HTTPBearer()

async def get_current_project(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> Project:
    auth_service = AuthService(db)
    
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication scheme")
    api_key = credentials.credentials.removeprefix("Bearer ").strip()
    
    try:
        return await auth_service.authenticate(api_key)
    except InvalidAPIKeyError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")