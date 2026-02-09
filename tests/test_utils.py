# tests/test_async.py
import pytest
from main import app
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_async_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
