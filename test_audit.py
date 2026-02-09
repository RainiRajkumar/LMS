import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta

async def check_audit_logs():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["react_school_managment"]
    audit_collection = db["audit_logs"]

    # Get logs from the last 5 minutes
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)

    print("Checking audit logs from the last 5 minutes...")
    print("=" * 50)

    # Query audit logs
    cursor = audit_collection.find({"timestamp": {"$gte": five_minutes_ago}})
    logs = await cursor.to_list(length=100)

    if not logs:
        print("No audit logs found in the last 5 minutes.")
        return

    print(f"Found {len(logs)} audit log(s):")
    print()

    for log in logs:
        print(f"Timestamp: {log['timestamp']}")
        print(f"Event Type: {log['event_type']}")
        print(f"User: {log['user']}")
        print(f"Action: {log['action']}")
        print(f"Resource: {log['resource']}")
        print(f"Details: {log['details']}")
        print(f"IP Address: {log.get('ip_address', 'N/A')}")
        print(f"User Agent: {log.get('user_agent', 'N/A')}")
        print("-" * 30)

    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(check_audit_logs())
