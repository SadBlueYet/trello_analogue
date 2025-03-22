from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware для разрешения запросов с любых IP адресов
# Базовый список разрешенных origins - в реальности будет использоваться 
# origin из заголовка запроса
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Это не имеет значения, middleware ниже переопределит заголовки
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=86400,
)

# Универсальный CORS middleware - разрешаем запросы с любого происхождения
@app.middleware("http")
async def universal_cors_middleware(request: Request, call_next):
    # Получаем origin из заголовков запроса
    origin = request.headers.get("origin", "")
    
    # Логируем, с какого origin пришел запрос
    if origin:
        logging.info(f"Request from origin: {origin}")
    
    # Специальная обработка для OPTIONS запросов (preflight)
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                # Устанавливаем полученный origin в заголовке Access-Control-Allow-Origin
                "Access-Control-Allow-Origin": origin or "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With, Origin",
                "Access-Control-Max-Age": "86400",
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin",
            },
        )
    
    # Выполняем обычную обработку для не-OPTIONS запросов
    response = await call_next(request)
    
    # Добавляем CORS заголовки в ответ для любого запроса
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)