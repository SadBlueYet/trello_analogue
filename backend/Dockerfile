# Используем официальный образ Python
FROM python:3.13

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app/

ENV PYTHONFAULTHANDLER=1 \
    PYTHONBUFFERED=1 \
    PIP_NO_CACHE_DIR=OFF \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PDM_VERSION=2.20.1 \
    PYTHONPATH=/app

    
# Установка зависимостей
RUN pip install --no-cache-dir "pdm==$PDM_VERSION" pip==23.2 && \
    pdm config python.use_venv false && \
    pdm config venv.in_project false && \
    pdm config check_update false

COPY pyproject.toml pdm.lock /app/
RUN pdm install -gp /app/ -v --prod

# Копируем файлы проекта в рабочую директорию
COPY . /app/

CMD ["sh", "-c", "alembic upgrade head && celery -A app.tasks worker --loglevel=info & python app/main.py"]
