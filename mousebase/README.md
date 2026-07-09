# MouseBase Python SDK

[![PyPI version](https://img.shields.io/pypi/v/mousebase)](https://pypi.org/project/mousebase/)

Python SDK for [MouseBase](https://mousebase.ai) — semantic memory for AI applications.

```bash
pip install mousebase
```

## Quickstart

```python
from mousebase import MouseBase

client = MouseBase(api_key="mb_live_xxx")
result = client.remember(content="User completed onboarding flow")
print(f"Stored memory: {result.memory_id}")
```

## Documentation

Full documentation at [docs.mousebase.ai](https://docs.mousebase.ai).

## License

MIT
