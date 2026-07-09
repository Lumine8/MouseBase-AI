import os
import pytest


@pytest.fixture(autouse=True)
def clear_env():
    saved = os.environ.pop("MOUSEBASE_API_KEY", None)
    yield
    if saved is not None:
        os.environ["MOUSEBASE_API_KEY"] = saved
    else:
        os.environ.pop("MOUSEBASE_API_KEY", None)
