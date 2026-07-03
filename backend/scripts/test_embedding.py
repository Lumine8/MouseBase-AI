import asyncio

from app.services.openai_embedding_service import OpenAIEmbeddingService

async def main():
    service = OpenAIEmbeddingService()
    text = "MouseBase Remembers things."

    print(f"Embedding text: {text}")
    vector = await service.embed(text)

    print(f"\nEmbedding generated successfully for text: '{text}'")

    print(f"Embedding dimensions: {len(vector)}")
    print(f"First 5 values: {vector[:5]}")

if __name__ == "__main__":
    asyncio.run(main())