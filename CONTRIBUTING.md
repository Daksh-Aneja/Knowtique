# Contributing to Knowtique

Thank you for your interest in contributing to Knowtique! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Daksh-Aneja/Knowtique/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the behaviour
   - Expected behaviour vs actual behaviour
   - Screenshots if applicable
   - Your environment (OS, Python version, Node version)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the use case and expected behaviour
3. Explain why this feature would be useful

### Pull Requests

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Test your changes**
5. **Commit**: `git commit -m "feat: add my feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Open a Pull Request** against `main`

## Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm run lint
npm run build  # Type-check
```

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints for function signatures
- Use `async`/`await` for database operations
- Use `logging` module instead of `print()`

### TypeScript (Frontend)
- Follow the ESLint configuration in `eslint.config.js`
- Use TypeScript strict mode types
- Use the `api` client for all backend calls — no direct `fetch()`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, no logic change)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Build process, dependency updates

## Project Structure

```
knowtique/
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # Entry point
│   │   ├── core/          # Config, database, auth
│   │   ├── models/        # SQLAlchemy domain models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── api/routes/    # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── agents/        # Agent runtime
│   │   ├── connectors/    # ETL connectors
│   │   └── transforms/    # ETL transform nodes
│   └── requirements.txt
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx        # Main application shell
│   │   ├── api/client.ts  # Typed API client
│   │   ├── views/         # 5 consolidated views
│   │   └── pages/         # 23 detailed page components
│   └── package.json
└── docker-compose.yml
```

## Questions?

Feel free to open an issue or start a discussion. We're happy to help!
