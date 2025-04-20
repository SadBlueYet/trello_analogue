FROM python:3.13

WORKDIR /app/

ENV PYTHONFAULTHANDLER=1 \
    PYTHONBUFFERED=1 \
    PIP_NO_CACHE_DIR=OFF \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PDM_VERSION=2.20.1 \
    PYTHONPATH=/app


RUN pip install --no-cache-dir "pdm==$PDM_VERSION" pip==23.2 && \
    pdm config python.use_venv false && \
    pdm config venv.in_project false && \
    pdm config check_update false

COPY pyproject.toml pdm.lock /app/
RUN pdm install -gp /app/ -v --prod

COPY . /app/

CMD ["sh", "-c", "alembic upgrade head && celery -A src.tasks worker --loglevel=info & python src/main.py"]
