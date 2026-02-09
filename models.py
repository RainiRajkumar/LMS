from enum import Enum
from pydantic import BaseModel, EmailStr, constr, conint, validator
from typing import Optional, List, Literal
from datetime import datetime, date

# ------------------- AUTH MODELS -------------------

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    username: str
    password: str


# ------------------- STUDENT MODELS -------------------

class StudentModel(BaseModel):
    name: constr(min_length=2, max_length=50) # type: ignore
    age: conint(gt=0, lt=120) # type: ignore
    course: constr(min_length=2, max_length=50) # type: ignore
    username: constr(min_length=3, max_length=30) # type: ignore
    password: constr(min_length=8, max_length=128) # type: ignore
    email: EmailStr
    student_photo_url: Optional[str] = None
    

class StudentResponse(BaseModel):
    id: int
    name: str
    age: int
    course: str
    username: str
    email: EmailStr


class InteractionModel(BaseModel):
    student_id: int
    query: str
    response: str
    created_at: datetime
    language: Optional[str] = "en-US"    # User preferred language
    voice_mode: Optional[bool] = False   # True if voice input/output

    class Config:
        orm_mode = True

class InteractionResponse(BaseModel):
    id: int
    student_id: int
    query: str
    response: str
    created_at: datetime
    language: Optional[str] = "en-US"
    voice_mode: Optional[bool] = False


class QuestionRequest(BaseModel):
    student_id: int
    query: str
    language: Optional[str] = "en-US"
    voice_mode: Optional[bool] = False


class StudentUpdateModel(BaseModel):
    name: Optional[constr(min_length=2, max_length=50)] = None # type: ignore
    age: Optional[conint(gt=0, lt=120)] = None # type: ignore
    course: Optional[constr(min_length=2, max_length=50)] = None # type: ignore
    username: Optional[constr(min_length=3, max_length=30)] = None # type: ignore
    password: Optional[constr(min_length=8, max_length=128)] = None # type: ignore # Optional now!
    email: Optional[EmailStr] = None
# ------------------- TRAINER MODELS -------------------

class TrainerCourseInfo(BaseModel):
    id: int
    title: str
    
class TrainerModel(BaseModel):
    name: constr(min_length=2, max_length=50) # type: ignore
    age: conint(gt=18, lt=120) # type: ignore
    username: constr(min_length=3, max_length=30) # type: ignore
    password: constr(min_length=8, max_length=128) # type: ignore
    email: EmailStr
    course_ids: List[int] = []  # Courses assigned to this trainer

class TrainerResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]=None
    username: str
    email: EmailStr  
    course_ids: List[int]=[]


class TrainerUpdateModel(BaseModel):
    name: Optional[constr(min_length=2, max_length=50)] = None # type: ignore
    age: Optional[conint(gt=18, lt=120)] = None # type: ignore
    username: Optional[constr(min_length=3, max_length=30)] = None # type: ignore
    password: Optional[constr(min_length=8, max_length=128)] = None # type: ignore # Optional for updates
    email: Optional[EmailStr] = None
    course_ids: Optional[List[int]] = None



class VideoModel(BaseModel):
    title: constr(min_length=2, max_length=100) # type: ignore
    description: Optional[str] = ""
    course_id: int
    video_url: str  # could be a file path or external URL


class VideoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    course_id: int
    video_url: str
    uploaded_by: str  # trainer username
    uploaded_on: datetime

# ------------------- COURSE MODELS -------------------

class CourseModel(BaseModel):
    title: str
    description: str
    course_fee: float
    seats: conint(gt=0)  # type: ignore # Total seats

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    seats: int
    course_fee: float
    enrolled_seats: int
    available_seats: int
    trainer_name: Optional[str] = None  # new field



# ------------------- ENROLLMENT MODELS -------------------

class EnrollmentModel(BaseModel):
    course_id: int

class EnrollmentResponse(BaseModel):
    id: int
    student_username: str
    course_id: int
    course_fee_amount:float
    enrolled_on: datetime

class StudentEnrollmentResponse(BaseModel):
    id: int
    student_name: str
    course_id: int
    course_description: str
    course_fee_amount:float
    username: str
    course_title: str
    enrolled_on: datetime

class EnrollmentAdminResponse(BaseModel):
    id: int
    student_name: str
    username: str
    course_id: int
    course_fee_amount:float
    course_title: str
    course_description: str
    enrolled_on: datetime




# ------------------- PAYMENT MODELS -------------------

class PaymentModel(BaseModel):
    enrollment_id: int
    amount: float
    payment_method: str  # "UPI", "Card", "NetBanking"


class PaymentResponse(BaseModel):
    id: int
    enrollment_id: int
    student_username: str
    course_id: int
    amount: float
    payment_method: str
    payment_status: str
    transaction_id: Optional[str]
    paid_on: datetime


class PaymentAdminResponse(BaseModel):
    id: int
    enrollment_id: int
    student_name: str
    username: str
    course_id: int
    course_title: str
    amount: float
    payment_method: str
    payment_status: str
    transaction_id: Optional[str]
    paid_on: datetime

class SubmissionStatus(str, Enum):
    PENDING = "pending"      # Student uploaded, waiting for check
    GRADED = "graded"        # Trainer checked and gave score


# ------------------- ASSIGNMENT MODELS -------------------

class Assignment(BaseModel):
    course_id: int
    title: str
    description: str
    due_date: datetime
    max_score: float
    reference_material_url: Optional[str] = None 

class AssignmentResponse(Assignment):
    id: int
    @validator("reference_material_url", pre=True, always=True)
    def set_default_reference(cls, value):
        return value or "N/A"

# ------------------- GRADE MODELS -------------------

class SubmissionCreate(BaseModel):
    assignment_id: int
    file_url: str
    comments: Optional[str] = None



class Grade(BaseModel):
    submission_id: int
    score: float
    feedback: str



class GradeUpdate(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    assignment_id: int
    file_url: str
    submitted_at: datetime
    status: SubmissionStatus
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = None
    graded_at: Optional[datetime] = None


# ------------------- ATTENDANCE MODELS -------------------

class AttendanceRecord(BaseModel):
    student_id: int
    course_id: int
    date: date
    status: Literal["Present", "Absent", "Late", "Excused"] # <-- FIX IS HERE



class TrainerStats(BaseModel):
    active_courses: int
    total_students: int
    pending_grading: int
    upcoming: int


class AttendanceRecordResponse(AttendanceRecord):
    pass





class RAGQuery(BaseModel):
    query: str

class AuditLog(BaseModel):
    id: int
    event_type: str
    user: str
    action: str
    resource: str
    details: dict
    created_at: datetime
    ip_address: str
