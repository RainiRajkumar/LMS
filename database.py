from motor.motor_asyncio import AsyncIOMotorClient   ##motor is asynchronous mongodb deriver
from config import MONGO_URI  

client = AsyncIOMotorClient(MONGO_URI)  ##connecr to the Mongodb server
db = client["react_school_managment"]  ##database 

student_collection = db["students"]
courses_collection = db["courses"]
enrollments_collection = db["enrollments"]
trainer_collection=db["trainer"]
assignment_collection=db["assignments"]
grades_collection=db["grades"]
attendance_collection=db["attendance"]
submission_collection=db["submission_collection"]
ai_tutor_collection = db["ai_tutor_collection"]
payment_collection = db["payments"]
video_collection = db["videos"]
audit_collection = db["audit_logs"]
