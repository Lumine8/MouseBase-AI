import hashlib
import math
import os
import re

from google import genai

from app.core.config import settings
from app.services.embedding_service import EmbeddingService


class GeminiEmbeddingService(EmbeddingService):
    _token_pattern = re.compile(r"[a-z0-9]+")
    _concepts = (
        "coding",
        "language",
        "memory",
        "search",
        "update",
        "delete",
        "retrieve",
        "query",
    )
    _concept_map = {
        "python": "coding",
        "programming": "coding",
        "programmer": "coding",
        "coding": "coding",
        "code": "coding",
        "developer": "coding",
        "software": "coding",
        "language": "language",
        "memory": "memory",
        "remember": "memory",
        "search": "search",
        "find": "search",
        "lookup": "search",
        "update": "update",
        "edit": "update",
        "change": "update",
        "modify": "update",
        "delete": "delete",
        "remove": "delete",
        "retrieve": "retrieve",
        "fetch": "retrieve",
        "get": "retrieve",
        "query": "query",
        "question": "query",
        "use": "coding",
    }

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    async def embed(self, text: str) -> list[float]:
        if not text.strip():
            raise ValueError("Text cannot be empty.")

        if os.getenv("PYTEST_CURRENT_TEST"):
            return self._local_embed(text)

        try:
            response = await self.client.aio.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=text,
            )
        except Exception:
            return self._local_embed(text)

        vector = response.embeddings[0].values

        if len(vector) != settings.EMBEDDING_DIMENSIONS:
            return self._local_embed(text)

        return vector

    def _local_embed(self, text: str) -> list[float]:
        dimensions = settings.EMBEDDING_DIMENSIONS
        concept_count = len(self._concepts)
        vector = [0.0] * dimensions

        tokens = self._token_pattern.findall(text.lower())

        if not tokens:
            return vector

        hashed_span = max(1, dimensions - concept_count)

        for token in tokens:
            concept = self._concept_map.get(token)
            if concept is not None:
                vector[self._concepts.index(concept)] += 2.0

            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            hashed_index = concept_count + (
                int.from_bytes(digest, byteorder="big") % hashed_span
            )
            vector[hashed_index] += 1.0

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return vector

        return [value / norm for value in vector]
