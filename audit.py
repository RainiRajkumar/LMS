# from datetime import datetime
# from database import audit_collection
# from fastapi import Request
# import json

# class AuditLogger:
#     def __init__(self):
#         self.collection = audit_collection

#     async def log_event(self, event_type: str, user: str, action: str, resource: str,
#                        details: dict = None, request: Request = None):
#         """
#         Log an audit event to the database.

#         Args:
#             event_type: Type of event (LOGIN_ATTEMPT, GRADE_CHANGE, PAYMENT_ACTION, ADMIN_OPERATION)
#             user: Username or user identifier
#             action: Specific action performed
#             resource: Resource affected (e.g., "assignment:123", "payment:456")
#             details: Additional details about the event
#             request: FastAPI request object for IP/user agent info
#         """
#         audit_entry = {
#             "created_at": datetime.utcnow(),
#             "event_type": event_type,
#             "user": user,
#             "action": action,
#             "resource": resource,
#             "details": details or {},
#             "ip_address": self._get_client_ip(request) if request else None,
#             "user_agent": self._get_user_agent(request) if request else None
#         }

#         if request:
#             audit_logger.update({
#                 "ip_address": request.client.host if request.client else None,
#                 "user_agent": request.headers.get("user-agent")
#             })

#         # MongoDB example (Motor)
#         await self.db.insert_one(audit_logger)
#         await self.collection.insert_one(audit_entry)

#     def _get_client_ip(self, request: Request) -> str:
#         """Extract client IP address from request."""
#         if not request:
#             return None

#         # Check for forwarded IP
#         forwarded = request.headers.get("X-Forwarded-For")
#         if forwarded:
#             return forwarded.split(",")[0].strip()

#         # Check for real IP
#         real_ip = request.headers.get("X-Real-IP")
#         if real_ip:
#             return real_ip

#         # Fallback to client host
#         return request.client.host if request.client else None

#     def _get_user_agent(self, request: Request) -> str:
#         """Extract user agent from request."""
#         return request.headers.get("User-Agent") if request else None

#     # Specific audit methods for different event types

#     async def log_login_attempt(self, username: str, success: bool, request: Request = None):
#         """Log login attempts (successful and failed)."""
#         action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
#         details = {"success": success}

#         await self.log_event(
#             event_type="LOGIN_ATTEMPT",
#             user=username,
#             action=action,
#             resource="authentication",
#             details=details,
#             request=request
#         )

#     async def log_grade_change(self, trainer_username: str, assignment_id: int,
#                               student_id: int, 
#                               new_score: float, 
#                               old_score: float | None=None,
#                               request: Request | None=None):
#         """Log grade changes by trainers."""

#         if old_score == new_score:
#             return
        
#         details = {
#             "assignment_id": assignment_id,
#             "student_id": student_id,
#             "old_score": old_score,
#             "new_score": new_score
#         }

#         await self.log_event(
#             event_type="GRADE_CHANGE",
#             user=trainer_username,
#             action="GRADE_SUBMITTED",
#             resource=f"assignment:{assignment_id}",
#             details=details,
#             request=request
#         )

#     async def log_payment_action(self, student_username: str, payment_id: int,
#                                 amount: float, action: str, request: Request = None):
#         """Log payment-related actions."""
#         details = {
#             "payment_id": payment_id,
#             "amount": amount,
#             "action": action  # e.g., "PAYMENT_INITIATED", "PAYMENT_COMPLETED", "PAYMENT_FAILED"
#         }

#         await self.log_event(
#             event_type="PAYMENT_ACTION",
#             user=student_username,
#             action=action,
#             resource=f"payment:{payment_id}",
#             details=details,
#             request=request
#         )

#     async def log_admin_operation(self, admin_username: str, operation: str,
#                                  resource: str, details: dict = None, request: Request = None):
#         """Log administrative operations."""
#         await self.log_event(
#             event_type="ADMIN_OPERATION",
#             user=admin_username,
#             action=operation,
#             resource=resource,
#             details=details,
#             request=request
#         )

# # Global audit logger instance
# audit_logger = AuditLogger()

# # Convenience functions for easy importing
# async def log_login_attempt(username: str, success: bool, request: Request = None):
#     await audit_logger.log_login_attempt(username, success, request)

# async def log_grade_change(trainer_username: str, assignment_id: int, student_id: int,
#                           old_score: float = None, new_score: float = None, request: Request = None):
#     await audit_logger.log_grade_change(trainer_username, assignment_id, student_id,
#                                        old_score, new_score, request)

# async def log_payment_action(student_username: str, payment_id: int, amount: float,
#                             action: str, request: Request = None):
#     await audit_logger.log_payment_action(student_username, payment_id, amount, action, request)

# async def log_admin_operation(admin_username: str, operation: str, resource: str,
#                              details: dict = None, request: Request = None):
#     await audit_logger.log_admin_operation(admin_username, operation, resource, details, request)


from datetime import datetime
from database import audit_collection
from fastapi import Request
from typing import Optional, Dict, Any


class AuditLogger:
    def __init__(self):
        self.collection = audit_collection

    async def log_event(
        self,
        event_type: str,
        user: str,
        action: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ):
        audit_entry = {
            "created_at": datetime.utcnow(),
            "event_type": event_type,
            "user": user,
            "action": action,
            "resource": resource,
            "details": details or {},
            "ip_address": self._get_client_ip(request),
            "user_agent": self._get_user_agent(request)
        }

        # ✅ Only ONE insert (correct)
        await self.collection.insert_one(audit_entry)

    # --------------------------------------------------
    # Helpers
    # --------------------------------------------------
    def _get_client_ip(self, request: Optional[Request]) -> Optional[str]:
        if not request:
            return None

        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        return request.client.host if request.client else None

    def _get_user_agent(self, request: Optional[Request]) -> Optional[str]:
        return request.headers.get("User-Agent") if request else None

    # --------------------------------------------------
    # Specific Audit APIs
    # --------------------------------------------------
    async def log_login_attempt(
        self,
        username: str,
        success: bool,
        request: Optional[Request] = None
    ):
        await self.log_event(
            event_type="LOGIN_ATTEMPT",
            user=username,
            action="LOGIN_SUCCESS" if success else "LOGIN_FAILED",
            resource="authentication",
            details={"success": success},
            request=request
        )

    async def log_grade_change(
        self,
        trainer_username: str,
        assignment_id: int,
        student_id: int,
        new_score: float,
        old_score: Optional[float] = None,
        request: Optional[Request] = None
    ):
        if old_score == new_score:
            return

        await self.log_event(
            event_type="GRADE_CHANGE",
            user=trainer_username,
            action="GRADE_SUBMITTED",
            resource=f"assignment:{assignment_id}",
            details={
                "student_id": student_id,
                "old_score": old_score,
                "new_score": new_score
            },
            request=request
        )

    async def log_payment_action(
        self,
        student_username: str,
        payment_id: int,
        amount: float,
        action: str,
        request: Optional[Request] = None
    ):
        await self.log_event(
            event_type="PAYMENT_ACTION",
            user=student_username,
            action=action,
            resource=f"payment:{payment_id}",
            details={
                "amount": amount
            },
            request=request
        )

    async def log_admin_operation(
        self,
        admin_username: str,
        operation: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ):
        await self.log_event(
            event_type="ADMIN_OPERATION",
            user=admin_username,
            action=operation,
            resource=resource,
            details=details,
            request=request
        )


# ✅ SINGLE GLOBAL INSTANCE
audit_logger = AuditLogger()

# --------------------------------------------------
# Convenience Functions (SAFE)
# --------------------------------------------------
async def log_login_attempt(username: str, success: bool, request: Request = None):
    await audit_logger.log_login_attempt(username, success, request)

async def log_grade_change(
    trainer_username: str,
    assignment_id: int,
    student_id: int,
    new_score: float,
    old_score: float = None,
    request: Request = None
):
    await audit_logger.log_grade_change(
        trainer_username,
        assignment_id,
        student_id,
        new_score,
        old_score,
        request
    )

async def log_payment_action(
    student_username: str,
    payment_id: int,
    amount: float,
    action: str,
    request: Request = None
):
    await audit_logger.log_payment_action(
        student_username,
        payment_id,
        amount,
        action,
        request
    )

async def log_admin_operation(
    admin_username: str,
    operation: str,
    resource: str,
    details: dict = None,
    request: Request = None
):
    await audit_logger.log_admin_operation(
        admin_username,
        operation,
        resource,
        details,
        request
    )
