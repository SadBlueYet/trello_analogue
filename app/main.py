from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, boards, lists, cards
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)
app.include_router(
    boards.router,
    prefix=f"{settings.API_V1_STR}/boards",
    tags=["boards"]
)
app.include_router(
    lists.router,
    prefix=f"{settings.API_V1_STR}/boards",
    tags=["lists"]
)
app.include_router(
    cards.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["cards"]
)