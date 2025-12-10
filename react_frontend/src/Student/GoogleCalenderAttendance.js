import React, { useState, useMemo } from "react";
import AttendanceModal from "./AttendanceModal";
import "./GoogleCalenderAttendance.css"

function GoogleCalenderAttendance({ attendance }) {
    const holidays = [
        "2025-01-01",
        "2025-01-26",
        "2025-12-25",
    ];

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedRecord, setSelectedRecord] = useState(null);

    // HELPER: Formats date as YYYY-MM-DD using Local Time to avoid timezone shifts
    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const attendanceMap = useMemo(() => {
        const map = {};
        attendance.forEach(a => {
            // Ensure we parse the input date correctly without timezone shifting
            // Assuming a.date is "YYYY-MM-DD" string
            const dateObj = new Date(a.date); 
            const key = formatDateLocal(dateObj);
            map[key] = a;
        });
        return map;
    }, [attendance]);

    const monthName = currentMonth.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    const getDaysMatrix = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const matrix = [];

        // Empty cells before first day
        for (let i = 0; i < firstDay.getDay(); i++) {
            matrix.push({ empty: true });
        }

        // Actual days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(year, month, day);
            
            // FIX: Use local formatter instead of toISOString()
            const key = formatDateLocal(d);

            matrix.push({
                empty: false,
                date: key,
                record: attendanceMap[key] || null,
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                isHoliday: holidays.includes(key)
            });
        }

        return matrix;
    };

    const grid = getDaysMatrix();

    const handlePrevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(prev.getMonth() - 1);
        setCurrentMonth(prev);
    };

    const handleNextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        setCurrentMonth(next);
    };

    return (
        <div className="gcal-container">
            {/* Header */}
            <div className="gcal-header">
                <button onClick={handlePrevMonth}>‹</button>
                <h2>{monthName}</h2>
                <button onClick={handleNextMonth}>›</button>
            </div>

            {/* Weekdays Row */}
            <div className="gcal-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                    <div key={w} className="weekday">{w}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="gcal-grid">
                {grid.map((day, i) =>
                    day.empty ? (
                        <div key={i} className="gcal-day empty"></div>
                    ) : (
                        <div
                            key={i}
                            className={`gcal-day 
                                ${day.record ? day.record.status.toLowerCase() : ""}
                                ${day.isWeekend ? "weekend" : ""}
                                ${day.isHoliday ? "holiday" : ""}
                            `}
                            onClick={() => setSelectedRecord(day.record || { date: day.date, status: "No Record" })}
                        >
                            {/* Parse the day number explicitly from the date string or use the loop index logic */}
                            <span className="day-num">{day.date.split("-")[2]}</span>

                            {/* Hover Tooltip */}
                            {day.record && (
                                <div className="tooltip">
                                    {day.record.status}
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Modal */}
            {selectedRecord && (
                <AttendanceModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                />
            )}
        </div>
    );
}

export default GoogleCalenderAttendance;