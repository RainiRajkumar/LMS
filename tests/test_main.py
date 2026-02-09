import pytest
from httpx import AsyncClient
from main import app  # Your FastAPI app
from database import student_collection
from auth import create_access_token

import asyncio

pytestmark = pytest.mark.asyncio

# ------------------- Test Config -------------------
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# Sample student data
sample_student = {
    "username": "teststudent",
    "email": "student@example.com",
    "password": "testpass123",
    "full_name": "Test Student"
}

@pytest.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# ------------------- Admin Login -------------------
async def test_admin_login(async_client):
    response = await async_client.post(
        "/admin/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

# ------------------- Create Student -------------------
async def test_create_student(async_client):
    # Get admin token first
    login_resp = await async_client.post(
        "/admin/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create student
    resp = await async_client.post("/students/", json=sample_student, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == sample_student["username"]
    global student_id
    student_id = data["id"]  # Store ID for later tests

# ------------------- Get Student -------------------
async def test_get_student(async_client):
    resp = await async_client.get(f"/students/{student_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == sample_student["username"]
    assert data["password"] == "********"

# ------------------- Student Login -------------------
async def test_student_login(async_client):
    resp = await async_client.post(
        "/student/login",
        json={"username": sample_student["username"], "password": sample_student["password"]}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data

# ------------------- Delete Student -------------------
async def test_delete_student(async_client):
    # Admin token
    login_resp = await async_client.post(
        "/admin/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await async_client.delete(f"/students/{student_id}", headers=headers)
    assert resp.status_code == 200 or resp.status_code == 204
