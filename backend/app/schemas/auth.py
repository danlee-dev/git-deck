from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class EmailRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class EmailLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    is_github_connected: bool

class GitHubConnect(BaseModel):
    code: str
