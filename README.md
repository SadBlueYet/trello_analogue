# Trello Clone

A Trello-like project built with FastAPI, SQLAlchemy, and PostgreSQL.

## Project Structure
```
trello_clone/
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API endpoints
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── boards.py
│   │   │   ├── lists.py
│   │   │   └── cards.py
│   │   ├── core/            # Core functionality
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── deps.py
│   │   ├── crud/            # CRUD operations
│   │   ├── db/              # Database
│   │   │   └── session.py
│   │   ├── models/          # SQLAlchemy models
│   │   └── schemas/         # Pydantic models
│   ├── static/              # Static files
│   └── templates/           # HTML templates
```

## Setup

1. Create a PostgreSQL database
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies:
```bash
pdm install
```

4. Run database migrations:
```bash
pdm run alembic upgrade head
```

5. Start the server:
```bash
pdm run uvicorn app.main:app --reload
```

## Features

- User authentication with JWT
- Board management
- List management
- Card management
- Drag and drop interface
- Real-time updates 