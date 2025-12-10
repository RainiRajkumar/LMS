import React from "react";
import "./AdvancedAttendanceCalendar.css";

function AttendanceModal({ record, onClose }) {
    return (
        <div className="attendance-modal-overlay" onClick={onClose}>
            <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Attendance Details</h2>
                <p><strong>Date:</strong> {record.date}</p>
                <p><strong>Status:</strong> {record.status}</p>
                <button className="close-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default AttendanceModal;
