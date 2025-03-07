# Kanban Board Application

A modern Kanban board application built with FastAPI and React, featuring real-time updates and drag-and-drop functionality.

## Features

- User authentication and authorization
- Board creation and management
- List and card organization with drag-and-drop
- Real-time updates
- Modern and responsive UI

## Technology Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication
- Alembic for migrations

### Frontend
- React
- TypeScript
- Redux Toolkit
- @hello-pangea/dnd for drag-and-drop
- TailwindCSS for styling

## Getting Started

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start the backend server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Development

The application is structured as follows:

- `/app` - Backend FastAPI application
  - `/api` - API endpoints
  - `/core` - Core functionality and configuration
  - `/crud` - Database operations
  - `/models` - SQLAlchemy models
  - `/schemas` - Pydantic schemas

- `/frontend` - React frontend application
  - `/src/components` - React components
  - `/src/store` - Redux store and slices
  - `/src/services` - API services
  - `/src/pages` - Page components

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

## License

MIT License 