import React from "react";
import "./AttendanceCalender.css";  // You will create this CSS

function AttendanceCalendar({ attendance }) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDay = monthStart.getDay();

    // Convert attendance records to dictionary by date key
    const attendanceMap = {};
    attendance.forEach(a => {
        const d = new Date(a.date);
        const key = d.toISOString().split("T")[0];
        attendanceMap[key] = a.status;
    });

    const days = [];

    // Empty spaces before month starts
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Real days
    for (let d = 1; d <= monthEnd.getDate(); d++) {
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const status = attendanceMap[dateKey];

        const statusClass = status ? status.toLowerCase() : "";
        const tooltip = status ? `Status: ${status}` : "No record";

        days.push(
            <div key={d} className={`calendar-day ${statusClass}`}>
                <span className="day-number">{d}</span>
                {status && <span className="status-dot" title={tooltip}></span>}
            </div>
        );
    }

    return (
        <div className="attendance-calendar">
            <h3>Attendance Calendar</h3>
            <div className="calendar-grid">
                <div className="weekday">Sun</div>
                <div className="weekday">Mon</div>
                <div className="weekday">Tue</div>
                <div className="weekday">Wed</div>
                <div className="weekday">Thu</div>
                <div className="weekday">Fri</div>
                <div className="weekday">Sat</div>
                {days}
            </div>
        </div>
    );
}

export default AttendanceCalendar;
