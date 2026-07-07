FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY README.md .

RUN pip install --upgrade pip

COPY . .

RUN pip install .

EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]