from typing import Optional
from xml.dom.minidom import Document
from database import  db,enrollments_collection,trainer_collection,student_collection,courses_collection



##auto increment id generator 
async def get_next_sequence(sequence_name: str) -> int:
    counter = await db.counters.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return counter["sequence_value"]

def student_helper(student) -> dict:
    return {
        "id": student["id"],
        "name": student["name"],
        "age": student["age"],
        "course": student["course"],
        "username": student["username"],
        "email":student["email"],
    }


def course_helper(course) -> dict:
    course_id = course["id"]
    seats = course.get("seats", 0)
    enrolled_seats = course.get("enrolled_seats", 0)  # This can be dynamically counted
    available_seats = seats - enrolled_seats if seats >= enrolled_seats else 0
  

    return {
        "id": course["id"],
        "title": course["title"],
        "description": course["description"],
        "course_fee":course["course_fee"], 
        "seats": seats,
        "enrolled_seats": enrolled_seats,
        "available_seats": available_seats,
    }

async def get_course_with_seats(course):
    enrolled_count = await enrollments_collection.count_documents({"course_id": course["id"]})
    course["enrolled_seats"] = enrolled_count
    return course_helper(course)

def enrollment_helper(enrollment) -> dict:
    return {
        "id": enrollment["id"],
        "student_username": enrollment["student_username"],
        "course_id": enrollment["course_id"],
        "course_fee_amount": enrollment["course_fee_amount"],
        "enrolled_on": enrollment["enrolled_on"].isoformat()  

    }

def assignment_helper(assignment: dict) -> dict:
      return {
        "id": assignment.get("id"),
        "course_id": assignment.get("course_id"),
        "title": assignment.get("title"),
        "description": assignment.get("description"),
        "due_date": assignment.get("due_date"),
        "max_score": assignment.get("max_score"),
        "reference_material_url":assignment.get("reference_material_url")
      }



def attendance_helper(record: dict) -> dict:
    return {
        "id": record["id"],
        "student_id": record["student_id"],
        "course_id": record["course_id"],
        "date": record["date"].date(),  # Ensure only the date part is returned
        "status": record["status"],
    }

def trainer_helper(trainer: dict) -> dict:
    return {
        "id": trainer["id"],
        "username": trainer["username"],
        "age":trainer.get("age"),
        "email": trainer["email"],
        "name": trainer["name"],
        "course_ids": trainer.get("course_ids",[]),
    }


# async def trainer_helper(trainer) -> dict:
#     # 1. Get the list of IDs from the trainer document
#     course_ids = trainer.get("course_ids", [])    
#     # 2. Find all courses that match these IDs
#     # (Assuming you have a 'course_collection')
#     courses_cursor = courses_collection.find({"id": {"$in": course_ids}})
#     # 3. Build the list of objects {id, title}
#     formatted_courses = []
#     async for course in courses_cursor:
#         formatted_courses.append({
#             "id": course["id"], 
#             "title": course["title"]
#         })

#     return {
#         "id": trainer["id"],
#         "name": trainer["name"],
#         "age": trainer.get("age"),
#         "username": trainer["username"],
#         "email": trainer["email"],
#         "courses": formatted_courses, # <--- Sending the detailed list
#     }


def submission_helper(submission) -> dict:
    return {
        "id": submission["id"],
        "student_id": submission["student_id"], # Retrieved from DB, not Input
        "assignment_id": submission["assignment_id"],
        "file_url": submission.get("file_url"),
        "submitted_at": submission.get("submitted_at"),
        "status": submission.get("status"),
        "score": submission.get("score"),
        "feedback": submission.get("feedback"),
        "graded_by": submission.get("graded_by"),
        "graded_at": submission.get("graded_at"),
    }


async def get_trainer_name_for_course(course_id: int) -> Optional[str]:
    trainer = await trainer_collection.find_one({"course_ids": course_id})
    if trainer:
        return trainer.get("name")
    return None


def interaction_helper(interaction: dict) -> dict:
    return {
        "id": interaction.get("id"),
        "student_id": interaction.get("student_id"),
        "query": interaction.get("query"),
        "response": interaction.get("response"),
        "created_at": interaction.get("created_at"),
        "language": interaction.get("language", "en-US"),
        "voice_mode": interaction.get("voice_mode", False)
    }
