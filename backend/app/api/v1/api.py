from fastapi import APIRouter
from app.api.v1.endpoints import users, profiles, blocks, blog, auth, github, feed, mypage, notifications, workflows

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(profiles.router, tags=["profiles"])
api_router.include_router(blocks.router, tags=["blocks"])
api_router.include_router(blog.router, prefix="/blog", tags=["blog"])
api_router.include_router(feed.router, prefix="/public", tags=["feed"])
api_router.include_router(mypage.router, prefix="/mypage", tags=["mypage"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
