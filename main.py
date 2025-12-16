from google import genai
from fastapi import FastAPI, Depends, Body, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from passlib.context import CryptContext
from datetime import datetime
from mail import send_enrollment_email
from models import EnrollmentResponse,EnrollmentAdminResponse,AssignmentResponse,AttendanceRecordResponse, StudentUpdateModel, TrainerUpdateModel, VideoModel, VideoResponse
from crud import enrollment_helper,get_course_with_seats, get_trainer_name_for_course,trainer_helper,assignment_helper,attendance_helper,submission_helper
from database import courses_collection, enrollments_collection,student_collection,trainer_collection,assignment_collection,submission_collection,attendance_collection,ai_tutor_collection,payment_collection
from models import CourseModel, CourseResponse,TrainerModel,TrainerResponse,TrainerStats,SubmissionCreate,SubmissionResponse,SubmissionStatus,PaymentAdminResponse,PaymentModel,PaymentResponse
from models import LoginRequest, StudentModel, StudentResponse, Token,StudentEnrollmentResponse,AttendanceRecord,Assignment,Grade,QuestionRequest,InteractionModel,InteractionResponse
from auth import verify_admin,create_access_token,verify_student,verify_trainer
from crud import student_helper,get_next_sequence,course_helper,assignment_helper,interaction_helper
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.responses import JSONResponse 
import hashlib
from fastapi import HTTPException
from passlib.context import CryptContext
import bcrypt
import passlib
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument
print("bcrypt version:", bcrypt.__version__)
print("passlib version:", passlib.__version__)
import os
from database import video_collection
from dotenv import load_dotenv

# Load environment variables
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key).aio

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins; change to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    encoded = password.encode("utf-8")[:72]
    sha = hashlib.sha256(encoded).hexdigest()
    return pwd_context.hash(sha.encode("utf-8"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    encoded = plain_password.encode("utf-8")[:72]
    sha = hashlib.sha256(encoded).hexdigest()
    return pwd_context.verify(sha.encode("utf-8"), hashed_password)

# ------------------- Admin Login -------------------
@app.post("/admin/login", response_model=Token)
async def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Hardcoded admin credentials
    ADMIN_USERNAME = "admin"
    ADMIN_PASSWORD = "admin123"  

    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")    
    print({form_data.username},{form_data.password})
    token = create_access_token({"sub": form_data.username, "role": "admin"})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/student/login", response_model=Token)
async def student_login(login: LoginRequest):
    student = await student_collection.find_one({"username": login.username})
    if not student or not verify_password(login.password, student["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": student["username"], "role": "student"})
    return {"access_token": token, "token_type": "bearer"}
    
@app.post("/trainer/login", response_model=Token)
async def trainer_login(login: LoginRequest):
    trainer = await trainer_collection.find_one({"username": login.username})
    
    if not trainer or not verify_password(login.password, trainer["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": trainer["username"], "role": "trainer"})    
    return {"access_token": token, "token_type": "bearer"}

# ------------------- Example Protected Routes -------------------
@app.get("/admin/dashboard")
async def admin_dashboard(payload: dict = Depends(verify_admin)):
    return {"message": f"Welcome Admin {payload['sub']}"}

@app.get("/student/profile", response_model=StudentResponse)
async def student_profile(payload: dict = Depends(verify_student)):
    username = payload["sub"]
    student = await student_collection.find_one({"username": username})
    if student:
        student_data = student_helper(student)
        student_data["password"] = "********"  # Mask password
        return student_data
    raise HTTPException(status_code=404, detail="Student not found")





@app.post("/students/", response_model=StudentResponse)
async def create_student(student: StudentModel, admin=Depends(verify_admin)):
    print(student) 
    try:

        student_dict = student.dict()
        student_dict["hashed_password"] = hash_password(student.password)
        student_dict.pop("password", None)
        student_dict["id"] = await get_next_sequence("studentid")
        result = await student_collection.insert_one(student_dict)
        created_student = await student_collection.find_one({"_id": result.inserted_id})
        created_student.pop("hashed_password", None)
        return StudentResponse(**created_student)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/students/", response_model=List[StudentResponse])
async def get_all_students():
    students = []
    async for student in student_collection.find().sort("id", 1):
        s = student_helper(student)       
        students.append(s) 
    return students
 
@app.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int):
    student = await student_collection.find_one({"id": student_id})
    if student:
        s = student_helper(student)
        s["password"] = "********"  
        return s
    raise HTTPException(status_code=404, detail="Student not found")

@app.delete("/students/{student_id}")
async def delete_student(student_id: int, admin=Depends(verify_admin)):
    result = await student_collection.delete_one({"id": student_id})
    if result.deleted_count:
        return {"detail": "Student deleted"}
    raise HTTPException(status_code=404, detail="Student not found")

# @app.put("/students/{student_id}", response_model=StudentResponse)
# async def update_student(student_id: int, student: StudentModel = Body(...), admin=Depends(verify_admin)):
#     existing_student = await student_collection.find_one({"id": student_id})
#     if not existing_student:
#         raise HTTPException(status_code=404, detail="Student not found")    
#     updated_data = student.dict()
#     updated_data["password"] = hash_password(student.password)    
#     await student_collection.update_one({"id": student_id}, {"$set": updated_data})
#     updated_student = await student_collection.find_one({"id": student_id})    
#     s = student_helper(updated_student)
#     s["password"] = "********"  
#     return s


@app.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: int, student: StudentUpdateModel = Body(...), admin=Depends(verify_admin)):
    # 1. Check if student exists
    existing_student = await student_collection.find_one({"id": student_id})
    if not existing_student:
        raise HTTPException(status_code=404, detail="Student not found")    
    
    # 2. Prepare data (exclude_unset=True ignores fields that weren't sent)
    updated_data = student.dict(exclude_unset=True)

    # 3. Handle Password Hashing ONLY if password was provided
    if "password" in updated_data:
        updated_data["hashed_password"] = hash_password(updated_data["password"])
        updated_data.pop("password", None)

    # 4. Update Database
    if updated_data:
        await student_collection.update_one({"id": student_id}, {"$set": updated_data})
    
    # 5. Return updated student
    updated_student_doc = await student_collection.find_one({"id": student_id})    
    s = student_helper(updated_student_doc)
    s.pop("hashed_password", None)
    
    return s

@app.post("/trainers/", response_model=TrainerResponse)
async def create_trainer(trainer: TrainerModel, admin=Depends(verify_admin)):
    print(trainer)
    try:
        trainer_dict = trainer.dict()
        
        # Hash password
        trainer_dict["hashed_password"] = hash_password(trainer.password)
        trainer_dict.pop("password", None)

        # Generate trainer ID
        trainer_dict["id"] = await get_next_sequence("trainerid")

        # Insert into DB
        result = await trainer_collection.insert_one(trainer_dict)
        created_trainer = await trainer_collection.find_one({"_id": result.inserted_id})

        # Remove hashed_password before sending to response
        created_trainer.pop("hashed_password", None)

        return TrainerResponse(**created_trainer)

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
 

@app.put("/trainers/{trainer_id}", response_model=TrainerResponse)
async def update_trainer(trainer_id: int, trainer: TrainerUpdateModel = Body(...), admin=Depends(verify_admin)):
    # 1. Check if trainer exists
    existing_trainer = await trainer_collection.find_one({"id": trainer_id})

    
    if not existing_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    # 2. Get the data sent by the frontend (ignoring nulls/unsets)
    updated_data = trainer.dict(exclude_unset=True)
    
    # 3. Handle Password Hashing logic
    if "password" in updated_data:
        # If user sent a new password, hash it and replace the plain text key
        updated_data["hashed_password"] = hash_password(updated_data["password"])
        updated_data.pop("password", None)
    
    # 4. Prevent ID from being changed accidentally
    updated_data.pop("id", None)

    # 5. Perform the update in MongoDB
    if updated_data:
        await trainer_collection.update_one({"id": trainer_id}, {"$set": updated_data})
    
    # 6. Fetch and return the updated document
    updated_trainer_doc = await trainer_collection.find_one({"id": trainer_id})
    
    # Assuming you have a helper similar to student_helper
    return trainer_helper(updated_trainer_doc)



@app.get("/trainers/", response_model=List[TrainerResponse])
async def get_all_trainers(admin=Depends(verify_admin)):
    try:
        trainers_cursor = trainer_collection.find()
        trainers = []

        async for trainer in trainers_cursor:
            trainer.pop("hashed_password", None)
            trainers.append(TrainerResponse(**trainer))
        return trainers
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})



async def get_trainer_by_username(username: str):
    trainer = await trainer_collection.find_one({"username": username})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer

@app.post("/trainer/videos/", response_model=VideoResponse)
async def add_video(video: VideoModel, trainer=Depends(verify_trainer)):
    # Fetch the full trainer document
    trainer_from_db = await get_trainer_by_username(trainer["sub"])
    print("Trainer from DB:", trainer_from_db)

    # Check if trainer is assigned to this course
    if str(video.course_id) not in map(str, trainer_from_db.get("course_ids", [])):
        raise HTTPException(status_code=403, detail="You are not assigned to this course")
    print("Trainer is assigned to the course.", video.course_id)
    # Create video document
    video_id = await get_next_sequence("video_id")
    video_doc = {
        "id": video_id,
        "title": video.title,
        "description": video.description,
        "course_id": video.course_id,
        "video_url": video.video_url,
        "uploaded_by": trainer_from_db["username"],
        "uploaded_on": datetime.utcnow().isoformat()  # <-- convert to string

    }

    await video_collection.insert_one(video_doc)
    return VideoResponse(**video_doc)


@app.get("/courses/{course_id}/videos/", response_model=List[VideoResponse])
async def get_course_videos(course_id: int):
    videos = []
    async for video in video_collection.find({"course_id": course_id}):
        videos.append(VideoResponse(**video))
    return videos


@app.delete("/admin/trainers/{trainer_id}")
async def delete_trainer(trainer_id: int, admin=Depends(verify_admin)):
    try:
        delete_result = await trainer_collection.delete_one({"id": trainer_id})

        if delete_result.deleted_count == 1:
            return {"message": f"Trainer with id {trainer_id} deleted successfully"}
        else:
            return JSONResponse(
                status_code=404,
                content={"error": f"Trainer with id {trainer_id} not found"}
            )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/admin/courses", response_model=CourseResponse)
async def create_course(course: CourseModel, admin=Depends(verify_admin)):
    course_dict = course.dict()
    course_dict["id"] = await get_next_sequence("courseid")
    await courses_collection.insert_one(course_dict)
    created = await courses_collection.find_one({"id": course_dict["id"]})
    return await get_course_with_seats(created)

@app.get("/admin/courses", response_model=List[CourseResponse])
async def list_courses(admin=Depends(verify_admin)):
    courses = []
    async for course in courses_collection.find().sort("id", 1):
        course_data = await get_course_with_seats(course)
        trainer_name = await get_trainer_name_for_course(course_data["id"])
        course_data["trainer_name"] = trainer_name
        courses.append(course_data)
        # courses.append(await get_course_with_seats(course))
    return courses

@app.put("/admin/courses/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseModel,
    admin=Depends(verify_admin)
):
    existing_course = await courses_collection.find_one({"id": course_id})
    if not existing_course:
        raise HTTPException(status_code=404, detail=f"Course with ID {course_id} not found")
    await courses_collection.update_one(
        {"id": course_id},
        {"$set": course_data.dict()}
    )
    updated_course_doc = await courses_collection.find_one({"id": course_id})    
    return await get_course_with_seats(updated_course_doc)


@app.delete("/admin/courses/{course_id}", response_model=dict)
async def delete_course(course_id: int, admin=Depends(verify_admin)):
    delete_result = await courses_collection.delete_one({"id": course_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Course with ID {course_id} not found")

    await enrollments_collection.delete_one({"course_id": course_id})
    return {
        "status": "success",
        "message": f"Course with ID {course_id} and all its enrollments have been deleted."
    }


@app.get("/admin/enrollments", response_model=List[EnrollmentAdminResponse])
async def get_students_enrollments(payload: dict = Depends(verify_admin)):
    username = payload["sub"]
    print("Looking for enrollments of username:", username)

    results = []
    async for enrollment in enrollments_collection.find():
        print("Found enrollment:", enrollment)
        student = await student_collection.find_one({"username": enrollment["student_username"]})
        course = await courses_collection.find_one({"id": enrollment["course_id"]})
        print("Student:", student)
        print("Course:", course)

        if student and course:
            results.append({
                "id": enrollment["id"],
                "student_name": student["name"],
                "course_id":course["id"],
                "course_description":course["description"],
                "username": student["username"],
                "course_title": course["title"],
                "course_fee_amount": float(course.get("course_fee", 0.0)) ,
                "enrolled_on":enrollment["enrolled_on"]
            })

    print("Final results:", results)
    return results

@app.get("/student/courses", response_model=List[CourseResponse])
async def get_all_courses(payload: dict = Depends(verify_student)):
    courses = []
    async for course in courses_collection.find().sort("id", 1):
        course_data = await get_course_with_seats(course)
        trainer_name = await get_trainer_name_for_course(course_data["id"])
        course_data["trainer_name"] = trainer_name
        courses.append(course_data)
    return courses

# ----------------- ENROLLMENTS -----------------
@app.post("/student/enroll", response_model=EnrollmentResponse)
async def enroll_course(
    enrollment: dict, 
    payload: dict = Depends(verify_student)
):
    username = payload["sub"]
    course_id = int(enrollment["course_id"])

    # Fetch course
    course = await courses_collection.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course_fee = course.get("course_fee", 0.0)

    
    # Check if already enrolled
    existing = await enrollments_collection.find_one({
        "student_username": username,
        "course_id": course_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    # Check seats
    enrolled_count = await enrollments_collection.count_documents({"course_id": course_id})
    if enrolled_count >= course["seats"]:
        raise HTTPException(status_code=400, detail="Course is full")

    # Create enrollment
    enrollment_dict = {
        "id": await get_next_sequence("enrollment_id"),
        "student_username": username,
        "course_id": course_id,
        "enrolled_on": datetime.utcnow(),
        "course_fee_amount": course_fee
    }
    await enrollments_collection.insert_one(enrollment_dict)

    
    # 🔥 DEDUCT ONE SEAT HERE
    await courses_collection.update_one(
        {"id": course_id},
        {"$inc": {"seats": -1}}     # decrease seat count by 1
    )

    # # Fetch student email
    # student = await student_collection.find_one({"username": username})
    # if not student or not student.get("email"):
    #     raise HTTPException(status_code=400, detail="Student email not found")


    # # Send email
    # send_enrollment_email(
    #     to_email=student["email"],
    #     student_name=student["name"],
    #     course_title=course["title"]
    # )

    return enrollment_helper(enrollment_dict)

@app.get("/student/enrollments", response_model=List[StudentEnrollmentResponse])
async def get_student_enrollments(payload: dict = Depends(verify_student)):
    username = payload["sub"]
    print("Looking for enrollments of username:", username)

    results = []
    async for enrollment in enrollments_collection.find({"student_username": username}):
        print("Found enrollment:", enrollment)
        student = await student_collection.find_one({"username": enrollment["student_username"]})
        course = await courses_collection.find_one({"id": enrollment["course_id"]})
        print("Student:", student)
        print("Course:", course)

        if student and course:
            results.append({
                "id": enrollment["id"],
                "student_name": student["name"],
                "course_id":course["id"],
                "course_description":course["description"],
                "username": student["username"],
                "course_title": course["title"],
                "enrolled_on":enrollment["enrolled_on"],
                "course_fee_amount": float(course.get("course_fee", 0.0)) 

            })

    print("Final results:", results)
    return results


async def count_documents(collection):
    return await collection.count_documents({})


async def count_full_courses():
    courses_cursor = courses_collection.find({})
    full_count = 0
    async for course in courses_cursor:
        enrolled_count = await enrollments_collection.count_documents({'course_id': course['_id']})
        if enrolled_count >= course['seats']:
            full_count += 1
    return full_count


@app.get("/dashboard")
async def get_dashboard():
    total_students = await count_documents(student_collection)
    total_courses = await count_documents(courses_collection)
    total_enrollments = await count_documents(enrollments_collection)
    full_courses = await count_full_courses()
    
    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "full_courses": full_courses
    }




# --- STUDENT ENDPOINTS ---

@app.get("/student/assignments/{course_id}", response_model=List[AssignmentResponse])
async def get_student_assignments_for_course(course_id: int, payload: dict = Depends(verify_student)):
    """
    Fetches all assignments for a specific course.
    """
    username = payload["sub"]
    
    # Security Check: Ensure the student is enrolled in this course
    is_enrolled = await enrollments_collection.find_one({
        "student_username": username,
        "course_id": course_id
    })
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    assignments = []
    async for assignment in assignment_collection.find({"course_id": course_id}):
        # Debugging: Print to terminal to see what DB returns
        print(f"DEBUG ASSIGNMENT FROM DB: {assignment}") 
        
        assignments.append(assignment_helper(assignment))
        
    # return assignments
    # assignments = []
    # # Fetch assignments
    # async for assignment in assignment_collection.find({"course_id": course_id}):
    #     # Data Integrity Check: Skip records that might be missing an ID (prevents 500 errors)
    #     if assignment.get("id") is None:
    #         continue 
            
    #     assignments.append(assignment_helper(assignment))
        
    return assignments


@app.get("/trainer/assignments/{assignment_id}/submissions", response_model=List[SubmissionResponse])
async def get_submissions_for_assignment(assignment_id: int, payload: dict = Depends(verify_trainer)):
    """
    Fetches all student submissions for a specific assignment.
    Verifies that the trainer teaches the course this assignment belongs to.
    """
    username = payload["sub"]
    trainer = await trainer_collection.find_one({"username": username})

    # 1. Fetch the Assignment to check Course ID
    assignment = await assignment_collection.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # 2. Security Check: Does the trainer own this course?
    if assignment["course_id"] not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not authorized to view submissions for this assignment")

    # 3. Fetch Submissions
    submissions = []
    async for sub in submission_collection.find({"assignment_id": assignment_id}):
        submissions.append(submission_helper(sub))

    return submissions

@app.get("/student/submissions/{course_id}", response_model=List[SubmissionResponse])
async def get_student_submissions_for_course(course_id: int, payload: dict = Depends(verify_student)):
    """
    Fetches all submissions (including Grades) for the logged-in student in a specific course.
    Replaces the old 'get_grades' endpoint.
    """
    username = payload["sub"]
    
    # 1. Get Student Details
    student = await student_collection.find_one({"username": username})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student_id = student["id"]

    # 2. Security Check: Enrollment
    is_enrolled = await enrollments_collection.find_one({
        "student_username": username,
        "course_id": course_id
    })
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # 3. Find all Assignment IDs belonging to this course
    # Optimization: Only fetch the 'id' field
    course_assignments_cursor = assignment_collection.find({"course_id": course_id}, {"id": 1})
    course_assignment_ids = [doc["id"] async for doc in course_assignments_cursor]

    # 4. Find all submissions for this student linked to those assignments
    submissions = []
    # Query: Student ID matches AND Assignment ID is in the list of course assignments
    async for sub in submission_collection.find({
        "student_id": student_id,
        "assignment_id": {"$in": course_assignment_ids}
    }):
        submissions.append(submission_helper(sub))
    
    return submissions


@app.get("/student/attendance/{course_id}", response_model=List[AttendanceRecordResponse])
async def get_student_attendance_for_course(course_id: int, payload: dict = Depends(verify_student)):
    """
    Fetches all attendance records for the logged-in student in a specific course.
    """
    username = payload["sub"]
    
    # 1. Get Student Details
    student = await student_collection.find_one({"username": username})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student_id = student["id"]
    
    # 2. Security Check
    is_enrolled = await enrollments_collection.find_one({
        "student_username": username,
        "course_id": course_id
    })
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")
    
    # 3. Fetch Attendance
    attendance_records = []
    async for record in attendance_collection.find({"student_id": student_id, "course_id": course_id}):
        attendance_records.append(attendance_helper(record))
        
    return attendance_records


# --- ADMIN ENDPOINTS ---

@app.get("/admin/assignments", response_model=List[AssignmentResponse])
async def get_all_assignments(payload: dict = Depends(verify_admin)):
    """
    Fetches all assignments across all courses (Admin only).
    """
    assignments = [assignment_helper(a) async for a in assignment_collection.find({})]
    return assignments
# --- TRAINER ENDPOINTS ---

@app.get("/trainer/profile", response_model=TrainerResponse)
async def read_trainer_profile(payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    return trainer_helper(trainer)

# # --- DASHBOARD & GENERAL GETS ---
# @app.get("/trainer/stats", response_model=TrainerStats)
# async def get_trainer_stats(payload: dict = Depends(verify_trainer)):
#     trainer = await trainer_collection.find_one({"username": payload["sub"]})
#     total_students = await student_collection.count_documents({})
#     # Mocked data for simplicity, can be replaced with real queries
#     return {"active_courses": len(trainer.get("course_ids", [])), "total_students": total_students, "pending_grading": 0, "upcoming": 0}

@app.get("/trainer/courses", response_model=List[CourseResponse])
async def get_trainer_courses(payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    courses_cursor = courses_collection.find({"id": {"$in": trainer.get("course_ids", [])}})
    return [course_helper(c) async for c in courses_cursor]

@app.get("/students", response_model=List[StudentResponse])
async def get_all_students(payload: dict = Depends(verify_trainer)):
    return [student_helper(s) async for s in student_collection.find()]


# --- ASSIGNMENT MANAGEMENT ---

@app.post("/trainer/assignments/", response_model=AssignmentResponse)
async def create_assignment(assignment: Assignment, payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    if assignment.course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not allowed to add assignments to this course")
    
    assignment_dict = assignment.dict()
    assignment_dict["id"] = await get_next_sequence("assignment_id")
    await assignment_collection.insert_one(assignment_dict)
    return assignment_helper(assignment_dict)

@app.put("/trainer/assignments/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(assignment_id: int, updated_data: Assignment, payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    existing = await assignment_collection.find_one({"id": assignment_id})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if existing["course_id"] not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not allowed to update this assignment")

    updated_assignment = await assignment_collection.find_one_and_update(
        {"id": assignment_id},
        {"$set": updated_data.dict()},
        return_document=ReturnDocument.AFTER
    )
    return assignment_helper(updated_assignment)

@app.get("/trainer/assignments/{course_id}", response_model=List[AssignmentResponse])
async def get_assignments_by_course(course_id: int, payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    if course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Access denied for this course")
    
    assignments = []
    async for a in assignment_collection.find({"course_id": course_id}):
        assignments.append(assignment_helper(a))
    return assignments



@app.get("/trainer/courses/{course_id}/students", response_model=List[StudentResponse])
async def get_students_enrolled_in_course(course_id: int, payload: dict = Depends(verify_trainer)):
    # 1. Get the trainer to verify they teach this course
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
        
    # Check if the requested course_id is in the trainer's assigned courses
    if course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not authorized to view students for this course")

    # 2. Get all enrollments for this specific course_id
    # We only need the 'student_username' field to identify the students
    enrollments_cursor = enrollments_collection.find({"course_id": course_id})
    
    enrolled_usernames = []
    async for enrollment in enrollments_cursor:
        # Based on your EnrollmentResponse model, the field is 'student_username'
        enrolled_usernames.append(enrollment.get("student_username"))

    # If no one is enrolled, return empty list immediately
    if not enrolled_usernames:
        return []

    # 3. Fetch full student details for the collected usernames
    # using the "$in" operator to match any username in the list
    students_cursor = student_collection.find({"username": {"$in": enrolled_usernames}})
    
    # Use your existing student_helper to format the output
    return [student_helper(s) async for s in students_cursor]


from typing import List
from fastapi import APIRouter, Depends, HTTPException

# Assuming you have an 'enrollment_collection' and 'student_collection'

@app.get("/courses/{course_id}/students", response_model=List[StudentResponse])
async def get_students_by_course(course_id: int, payload: dict = Depends(verify_trainer)):
    # 1. Verification
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    if course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not authorized for this course")

    # 2. Find enrollments for the course
    enrollment_cursor = enrollments_collection.find({"course_id": course_id})
    enrollments = await enrollment_cursor.to_list(length=1000)
    
    if not enrollments:
        return []

    # 3. Extract 'student_username' (Based on your logs)
    # We use a set to avoid duplicates if a student is enrolled multiple times
    student_usernames = {e["student_username"] for e in enrollments if "student_username" in e}

    if not student_usernames:
        return []

    # 4. Fetch student details using 'username'
    # IMPORTANT: We search the 'username' field in student_collection
    students_cursor = student_collection.find({"username": {"$in": list(student_usernames)}})
    students = await students_cursor.to_list(length=1000)

    return [student_helper(student) for student in students]

from datetime import datetime

@app.get("/trainer/stats")
async def get_trainer_stats(payload: dict = Depends(verify_trainer)):
    username = payload["sub"]
    trainer = await trainer_collection.find_one({"username": username})
    
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    course_ids = trainer.get("course_ids", [])

    # 1. Total Students Logic (Unchanged)
    enrollment_cursor = enrollments_collection.find({"course_id": {"$in": course_ids}})
    all_enrollments = await enrollment_cursor.to_list(length=10000)
    unique_students = {e.get("student_username") for e in all_enrollments if e.get("student_username")}
    total_students_count = len(unique_students)

    # 2. Upcoming Assignments (FIXED)
    # Get current UTC time as a datetime object, NOT a string
    current_time = datetime.utcnow()
    
    upcoming_count = await assignment_collection.count_documents({
        "course_id": {"$in": course_ids},
        "due_date": {"$gte": current_time}  # <-- Passed as datetime object
    })

    # --- DEBUGGING BLOCK (Remove after fixing) ---
    print(f"DEBUG: Current Time used for query: {current_time} (Type: {type(current_time)})")
    
    # Let's fetch ONE assignment to see how it looks in the DB
    sample_assignment = await assignment_collection.find_one({"course_id": {"$in": course_ids}})
    if sample_assignment:
        db_date = sample_assignment.get('due_date')
        print(f"DEBUG: Sample DB Date: {db_date} (Type: {type(db_date)})")
    else:
        print("DEBUG: No assignments found at all for these courses.")
    # ---------------------------------------------

    # 3. Pending Grading Logic (Unchanged)
    assignments_cursor = assignment_collection.find({"course_id": {"$in": course_ids}})
    assignments = await assignments_cursor.to_list(length=1000)
    assignment_ids = [a["id"] for a in assignments]
    
    pending_grading_count = await submission_collection.count_documents({
        "assignment_id": {"$in": assignment_ids},
        "status": "submitted"
    })

    return {
        "active_courses": len(course_ids),
        "total_students": total_students_count,
        "pending_grading": pending_grading_count,
        "upcoming": upcoming_count
    }

@app.post("/student/submit/", status_code=status.HTTP_201_CREATED)
async def submit_assignment(submission: SubmissionCreate, payload: dict = Depends(verify_student)):
    username = payload.get("sub")

    # 1. Fetch Student Details (to get student_id)
    student = await student_collection.find_one({"username": username})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    student_id = student["id"]

    # 2. Validate Assignment Exists
    assignment = await assignment_collection.find_one({"id": submission.assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # 3. Security Check: Is student enrolled in this course?
    is_enrolled = await enrollments_collection.find_one({
        "student_username": username,
        "course_id": assignment["course_id"]
    })
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in the course for this assignment")

    # 4. Check if already submitted
    existing_submission = await submission_collection.find_one({
        "assignment_id": submission.assignment_id,
        "student_id": student_id
    })
    if existing_submission:
        raise HTTPException(status_code=400, detail="You have already submitted this assignment.")

    # 5. Create Submission Record
    new_submission_id = await get_next_sequence("submission_id")
    
    submission_doc = {
        "id": new_submission_id,
        "assignment_id": submission.assignment_id,
        "student_id": student_id,
        "file_url": submission.file_url,
        "comments": submission.comments,
        "submitted_at": datetime.utcnow(),
        "status": SubmissionStatus.PENDING,  # Default status is 'pending'
        "score": None,
        "feedback": None,
        "graded_by": None,
        "graded_at": None
    }

    await submission_collection.insert_one(submission_doc)

    return {
        "message": "Assignment submitted successfully",
        "submission_id": new_submission_id,
        "status": "pending"
    }

# --- ATTENDANCE ---
@app.post("/trainer/attendance/", response_model=AttendanceRecordResponse)
async def mark_attendance(attendance: AttendanceRecord, payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    if attendance.course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not authorized for this course")
    search_filter = {
        "student_id": attendance.student_id,
        "course_id": attendance.course_id,
        "date": datetime.combine(attendance.date, datetime.min.time())
    }
    update_data = {
        "$set": {
            "status": attendance.status
        },
        "$setOnInsert": {
            "id": await get_next_sequence("attendance_id"),
            "student_id": attendance.student_id,
            "course_id": attendance.course_id,
            "date": datetime.combine(attendance.date, datetime.min.time())
        }
    }

    updated_record = await attendance_collection.find_one_and_update(
        search_filter,
        update_data,
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return attendance_helper(updated_record)



@app.get("/trainer/attendance/{course_id}", response_model=List[AttendanceRecordResponse])
async def get_attendance(course_id: int, payload: dict = Depends(verify_trainer)):
    trainer = await trainer_collection.find_one({"username": payload["sub"]})
    if course_id not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="Not allowed to view attendance for this course")
    records = [attendance_helper(r) async for r in attendance_collection.find({"course_id": course_id})]
    return records


from pymongo import ReturnDocument
from datetime import datetime

@app.put("/trainer/grade-submission", response_model=SubmissionResponse)
async def grade_submission(grade_data: Grade, payload: dict = Depends(verify_trainer)):
    """
    Updates a specific submission with a score and feedback.
    Changes status from 'pending'/'submitted' to 'graded'.
    """
    username = payload["sub"]
    trainer = await trainer_collection.find_one({"username": username})

    # 1. Find the Submission
    submission = await submission_collection.find_one({"id": grade_data.submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # 2. Find the Assignment (To check Max Score and Course ownership)
    assignment = await assignment_collection.find_one({"id": submission["assignment_id"]})
    if not assignment:
        raise HTTPException(status_code=404, detail="Associated assignment data not found")

    # 3. Security Check: Does the trainer teach this course?
    if assignment["course_id"] not in trainer.get("course_ids", []):
        raise HTTPException(status_code=403, detail="You are not authorized to grade assignments for this course")

    # 4. Validation: Score vs Max Score
    if grade_data.score > assignment["max_score"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Score ({grade_data.score}) cannot exceed max score of {assignment['max_score']}"
        )

    # 5. Update the Submission Record
    update_data = {
        "$set": {
            "score": grade_data.score,
            "feedback": grade_data.feedback,
            "status": SubmissionStatus.GRADED, # Sets status to "graded"
            "graded_by": trainer["id"],        # Tracks which trainer graded it
            "graded_at": datetime.utcnow()
        }
    }

    updated_record = await submission_collection.find_one_and_update(
        {"id": grade_data.submission_id},
        update_data,
        return_document=ReturnDocument.AFTER
    )

    return submission_helper(updated_record)









# @app.("/student/ask/", status_code=status.HTTP_201_CREATED)
# async def ask_question(request: QuestionRequest, payload: dict = Depends(verify_student)):
#     username = payload.get("sub")

#     # 1. Fetch student details
#     student = await student_collection.find_one({"id": request.student_id})
#     if not student:
#         raise HTTPException(status_code=404, detail="Student not found")

#     # 2. Check if student is enrolled in the course
#     is_enrolled = await enrollments_collection.find_one({
#         "student_username": username,
#         # "course_id": request.course_id
#     })
#     if not is_enrolled:
#         raise HTTPException(status_code=403, detail="You are not enrolled in this course")

#     # 3. Generate AI response (mock for now)
#     ai_response = f"AI response to: {request.query}"  # Replace with Gemini AI call

#     # 4. Insert interaction record
#     interaction_doc = {
#         "student_id": request.student_id,
#         "query": request.query,
#         "response": ai_response,
#         "created_at": datetime.utcnow(),
#         "language": request.language,
#         "voice_mode": request.voice_mode
#     }
#     result = await ai_tutor_collection.insert_one(interaction_doc)

#     return {
#         "message": "Question submitted successfully",
#         "interaction_id": interaction_helper(interaction_doc),
#         "status": "answered",
#         "response": ai_response
#     }



@app.post("/student/ask/", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def ask_question(request: QuestionRequest, payload: dict = Depends(verify_student)):
    username = payload.get("sub")

    # 1. Fetch student
    student = await student_collection.find_one({"id": request.student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Check enrollment
    is_enrolled = await enrollments_collection.find_one({"student_username": username})
    if not is_enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # 3. Generate AI response using Gemini API
    try:
        response = await client.models.generate_content(
            model="gemini-2.5-flash",      # Use a valid Gemini model
            contents=request.query          # Your user's question
        )
        ai_response = response.text

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

    # 4. Generate integer ID for interaction
    new_interaction_id = await get_next_sequence("ai_tutor_id")

    # 5. Insert interaction into MongoDB
    interaction_doc = {
        "id": new_interaction_id,
        "student_id": request.student_id,
        "query": request.query,
        "response": ai_response,
        "created_at": datetime.utcnow(),
        "language": request.language,
        "voice_mode": request.voice_mode
    }
    await ai_tutor_collection.insert_one(interaction_doc)

    # 6. Return response matching InteractionResponse
    return InteractionResponse(**interaction_doc)

@app.get("/student/history/{student_id}", response_model=List[InteractionResponse])
async def get_interaction_history(student_id: int, payload: dict = Depends(verify_student)):
    # 1. Verify student exists
    student = await student_collection.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Fetch interactions sorted by newest first
    cursor = ai_tutor_collection.find({"student_id": student_id}).sort("created_at", -1)
    interactions = []
    async for doc in cursor:
        interactions.append(interaction_helper(doc))

    return interactions










@app.post("/payment/pay", response_model=PaymentResponse)
async def make_payment(payment: PaymentModel, payload: dict = Depends(verify_student)):

    username = payload.get("sub")

    # Check enrollment exists
    enrollment = await enrollments_collection.find_one({"id": payment.enrollment_id})
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Only the enrolled student can pay
    if enrollment["student_username"] != username:
        raise HTTPException(status_code=403, detail="This enrollment does not belong to you")

    course = await courses_collection.find_one({"id": enrollment["course_id"]})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    actual_fee = float(course.get("course_fee", 0))
    if payment.amount != actual_fee:
        raise HTTPException(status_code=400, detail=f"Invalid amount. Expected {actual_fee}")
    # Generate new payment ID
    new_payment_id = await get_next_sequence("payment_id")

    # Fake transaction ID
    transaction_id = f"TXN{new_payment_id}{int(datetime.utcnow().timestamp())}"

    payment_doc = {
        "id": new_payment_id,
        "enrollment_id": enrollment["id"],
        "student_username": username,
        "course_id": course["id"],
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "payment_status": "SUCCESS",
        "transaction_id": transaction_id,
        "paid_on": datetime.utcnow()
    }
    print(payment_doc)

    await payment_collection.insert_one(payment_doc)

    return PaymentResponse(**payment_doc)


@app.get("/payment/history", response_model=List[PaymentResponse])
async def payment_history(payload: dict = Depends(verify_student)):
    username = payload.get("sub")

    payments = await payment_collection.find({"student_username": username}).to_list(100)

    return [PaymentResponse(**p) for p in payments]

@app.get("/payment/admin/all", response_model=List[PaymentAdminResponse])
async def admin_all_payments(payload: dict = Depends(verify_admin)):

    payments = await payment_collection.find().to_list(500)

    final_output = []

    for p in payments:
        # Fetch related data
        student = await student_collection.find_one({"username": p["student_username"]})
        course = await courses_collection.find_one({"id": p["course_id"]})

        # --- FIX: SAFETY CHECK ---
        # Ensure student and course exist before trying to access their fields
        if student and course:
            final_output.append(
                PaymentAdminResponse(
                    id=p["id"],
                    enrollment_id=p["enrollment_id"],
                    
                    # --- FIX: CHANGED 'full_name' TO 'name' ---
                    # Your database logs show the key is 'name'
                    student_name=student.get("name", "Unknown"), 
                    username=p["student_username"],
                    course_id=course["id"],
                    course_title=course["title"],
                    amount=p["amount"],
                    payment_method=p["payment_method"],
                    payment_status=p["payment_status"],
                    transaction_id=p["transaction_id"],
                    paid_on=p["paid_on"]
                )
            )

    return final_output