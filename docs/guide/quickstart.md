# Quickstart

Get your first memory stored in 30 seconds.

## 1. Get an API key

Sign up at [app.mousebase.dev](https://app.mousebase.dev) and create a project. Copy the API key.

## 2. Install the SDK

```bash
pip install mousebase
```

## 3. Store a memory

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")
result = client.remember(content="User completed onboarding flow")
print(result.memory_id)
```

## 4. Search memories

```python
results = client.search(query="user onboarding")
for r in results.results:
    print(f"[{r.score:.2f}] {r.content}")
```

## Next steps

- Read the [Python SDK guide](/guide/python-sdk)
- See all [error codes](/guide/errors)
