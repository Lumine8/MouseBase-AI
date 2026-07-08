# Installation

## Python SDK

```bash
pip install mousebase
```

Requires Python 3.12+.

## From Source

```bash
git clone https://github.com/anomalyco/MouseBase.git
cd MouseBase/backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e .
```

## Docker

```bash
docker pull lumine8/mousebase
```

Or build from source:

```bash
docker build -t mousebase backend/
```

## Run with Docker Compose

```bash
cd backend
cp .env.example .env
# Edit .env with your keys
docker compose up --build
```

The API will be available at `http://localhost:8000`.

## Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.
