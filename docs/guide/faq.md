# FAQ

## What is MouseBase?

MouseBase is a managed memory service for AI applications. It stores text as vector embeddings and enables semantic search — so your AI agents can recall relevant context.

## How does it compare to a vector database?

You don't manage infrastructure. MouseBase handles embedding generation, vector storage, indexing, and search. You call a simple API.

## What embedding models do you use?

MouseBase supports both Gemini and OpenAI embeddings. The active model is configured on the server side.

## Is there a JavaScript SDK?

Coming soon.

## Do you offer self-hosting?

Not currently. MouseBase is a managed cloud service.

## How do I rotate my API key?

Use the dashboard or the SDK:

```python
client.projects.rotate_key("project-uuid")
```

## How is billing handled?

Billing is manual during beta. Contact the team for plan details.
