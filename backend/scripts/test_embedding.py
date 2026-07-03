from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import asyncio

from app.services.gemini_embedding_service import GeminiEmbeddingService


async def main():
    service = GeminiEmbeddingService()
    text = "MouseBase Remembers things."

    print(f"Embedding text: {text}")
    vector = await service.embed(text)

    print(f"\nEmbedding generated successfully for text: '{text}'")

    print(f"Embedding dimensions: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")

if __name__ == "__main__":
    asyncio.run(main())