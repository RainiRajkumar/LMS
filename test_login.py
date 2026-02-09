import asyncio
import httpx
from main import app

async def test_logins():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Test admin login
        print("Testing admin login...")
        response = await client.post("/admin/login", data={"username": "admin", "password": "admin123"})
        print(f"Admin login status: {response.status_code}")
        if response.status_code == 200:
            print("Admin login successful")
        else:
            print(f"Admin login failed: {response.text}")

        # Create a test student
        print("\nCreating test student...")
        student_data = {
            "name": "Test Student",
            "age": 20,
            "course": "Python",
            "username": "teststudent",
            "password": "testpass123",
            "email": "test@example.com"
        }
        response = await client.post("/students/", json=student_data, headers={"Authorization": "Bearer " + response.json()["access_token"]})
        print(f"Create student status: {response.status_code}")

        # Test student login
        print("\nTesting student login...")
        response = await client.post("/student/login", json={"username": "teststudent", "password": "testpass123"})
        print(f"Student login status: {response.status_code}")
        if response.status_code == 200:
            print("Student login successful")
        else:
            print(f"Student login failed: {response.text}")

        # Create a test trainer
        print("\nCreating test trainer...")
        trainer_data = {
            "name": "Test Trainer",
            "age": 30,
            "username": "testtrainer",
            "password": "testpass123",
            "email": "trainer@example.com",
            "course_ids": []
        }
        response = await client.post("/trainers/", json=trainer_data, headers={"Authorization": "Bearer " + response.json()["access_token"]})
        print(f"Create trainer status: {response.status_code}")

        # Test trainer login
        print("\nTesting trainer login...")
        response = await client.post("/trainer/login", json={"username": "testtrainer", "password": "testpass123"})
        print(f"Trainer login status: {response.status_code}")
        if response.status_code == 200:
            print("Trainer login successful")
        else:
            print(f"Trainer login failed: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_logins())
