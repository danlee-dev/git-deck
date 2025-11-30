from fastapi import APIRouter
from app.api.v1.endpoints import users, profiles, blocks, blog, auth, github

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(profiles.router, tags=["profiles"])
api_router.include_router(blocks.router, tags=["blocks"])
api_router.include_router(blog.router, tags=["blog"])
