import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Home, Award, FileText, Clipboard, BookOpen, Users, Calendar, LogOut, Plus, Loader,
    AlertTriangle, CheckCircle, XCircle, Clock, AlertCircle as AlertIcon, Search,
    Edit2, Trash2, Save, X, ExternalLink
} from 'react-feather';
import {  Menu } from 'react-feather';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './TrainerDashboard.css';

// --- HELPERS ---
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(d.getTime() - userTimezoneOffset);
    return adjustedDate.toISOString().split('T')[0];
};

const formatDateTimeReadable = (isoString) => {
    if (!isoString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(isoString).toLocaleDateString(undefined, options);
};

const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '');


// --- CHILD COMPONENTS ---

// 1. Attendance Page
function AttendancePage({
    attendance, courseStudents, trainerCourses, selectedCourseId, setSelectedCourseId, isCourseDataLoading, handleMarkAttendance
}) {
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [searchTerm, setSearchTerm] = useState('');

    const attendanceMap = useMemo(() => {
        const todaysRecords = attendance.filter(r => formatDate(r.date) === selectedDate);
        return new Map(todaysRecords.map(r => [r.student_id, r.status]));
    }, [attendance, selectedDate]);

    const filteredStudents = useMemo(() =>
        courseStudents.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [courseStudents, searchTerm]
    );

    const attendanceStats = useMemo(() => {
        const counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
        attendanceMap.forEach(status => {
            if (counts[status] !== undefined) counts[status]++;
        });
        return { ...counts, Total: courseStudents.length };
    }, [attendanceMap, courseStudents]);

    return (
        <div className="td-page-container">
            <div className="td-header-section">
                <div>
                    <h2 className="td-page-title">Attendance Tracking</h2>
                    <p className="td-page-subtitle">Mark and manage daily student attendance</p>
                </div>
            </div>

            <div className="td-mini-stats-grid">
                <div className="td-mini-card td-green">
                    <div className="td-icon-circle"><CheckCircle size={20} /></div>
                    <div><span className="td-stat-value">{attendanceStats.Present}</span><span className="td-stat-label">Present</span></div>
                </div>
                <div className="td-mini-card td-red">
                    <div className="td-icon-circle"><XCircle size={20} /></div>
                    <div><span className="td-stat-value">{attendanceStats.Absent}</span><span className="td-stat-label">Absent</span></div>
                </div>
                <div className="td-mini-card td-orange">
                    <div className="td-icon-circle"><Clock size={20} /></div>
                    <div><span className="td-stat-value">{attendanceStats.Late}</span><span className="td-stat-label">Late</span></div>
                </div>
                <div className="td-mini-card td-purple">
                    <div className="td-icon-circle"><Users size={20} /></div>
                    <div><span className="td-stat-value">{attendanceStats.Total}</span><span className="td-stat-label">Total</span></div>
                </div>
            </div>

            <div className="td-controls-bar">
                <div className="td-control-group">
                    <label>Date</label>
                    <input type="date" className="td-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="td-control-group">
                    <label>Course</label>
                    <select className="td-select" onChange={(e) => setSelectedCourseId(e.target.value)} value={selectedCourseId}>
                        <option value="">Select a Course</option>
                        {trainerCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div className="td-control-group wide">
                    <label>Search Student</label>
                    <div className="td-search-wrapper">
                        <Search size={16} />
                        <input type="text" className="td-input-search" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="td-table-card">
                {!selectedCourseId ? <div className="td-empty-state"><p>Select a course to start tracking.</p></div> :
                    isCourseDataLoading ? <div className="td-loading-state"><Loader className="td-spin" /></div> :
                    (<>
                        <div className="td-table-header td-grid-attendance">
                            <span>Student Name</span>
                            <span className="td-center-text">Mark Status</span>
                        </div>
                        <div className="td-table-body">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => {
                                    const currentStatus = attendanceMap.get(student.id);
                                    return (
                                        <div className="td-table-row td-grid-attendance" key={student.id}>
                                            <div className="td-user-info">
                                                <div className="td-avatar-sm">{getInitials(student.name)}</div>
                                                <span>{student.name}</span>
                                            </div>
                                            <div className="td-action-buttons-row">
                                                <button title="Present" onClick={() => handleMarkAttendance(student.id, 'Present', selectedDate)} className={`td-action-btn present ${currentStatus === 'Present' ? 'active' : ''}`}><CheckCircle size={18} /></button>
                                                <button title="Absent" onClick={() => handleMarkAttendance(student.id, 'Absent', selectedDate)} className={`td-action-btn absent ${currentStatus === 'Absent' ? 'active' : ''}`}><XCircle size={18} /></button>
                                                <button title="Late" onClick={() => handleMarkAttendance(student.id, 'Late', selectedDate)} className={`td-action-btn late ${currentStatus === 'Late' ? 'active' : ''}`}><Clock size={18} /></button>
                                                <button title="Excused" onClick={() => handleMarkAttendance(student.id, 'Excused', selectedDate)} className={`td-action-btn excused ${currentStatus === 'Excused' ? 'active' : ''}`}><AlertIcon size={18} /></button>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="td-empty-state"><p>No students found.</p></div>
                            )}
                        </div>
                    </>)
                }
            </div>
        </div>
    );
}

// 2. Grades Page
function GradesPage({
    allStudents, trainerCourses, assignments, submissions, selectedCourseId, setSelectedCourseId,
    selectedAssignmentId, setSelectedAssignmentId, isSubmissionsLoading, handleSaveGrade,
    studentGradeForms, setStudentGradeForms
}) {
    const handleGradeChange = (submissionId, field, value) => {
        setStudentGradeForms(prev => ({
            ...prev,
            [submissionId]: { ...prev[submissionId], [field]: value }
        }));
    };

    const getStudentName = (id) => {
        const s = allStudents.find(std => std.id === id);
        return s ? s.name : `Student #${id}`;
    };

    const currentAssignment = assignments.find(a => a.id == selectedAssignmentId);

    return (
        <div className="td-page-container">
            <div className="td-header-section">
                <div>
                    <h2 className="td-page-title">Submission Grading</h2>
                    <p className="td-page-subtitle">Review files and assign scores</p>
                </div>
            </div>
            
            <div className="td-controls-bar">
                <div className="td-control-group">
                    <label>Course</label>
                    <select className="td-select" value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedAssignmentId(''); }}>
                        <option value="">Select a Course</option>
                        {trainerCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div className="td-control-group flex-grow">
                    <label>Assignment</label>
                    <select className="td-select" value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} disabled={!selectedCourseId}>
                        <option value="">Select Assignment</option>
                        {assignments.map(a => <option key={a.id} value={a.id}>{a.title} (Max: {a.max_score} pts)</option>)}
                    </select>
                </div>
            </div>

            <div className="td-table-card">
                {!selectedCourseId || !selectedAssignmentId ? 
                    <div className="td-empty-state"><p>Select Course & Assignment to view submissions.</p></div> 
                : isSubmissionsLoading ? 
                    <div className="td-loading-state"><Loader className="td-spin" /> Fetching...</div> 
                : submissions.length === 0 ?
                    <div className="td-empty-state"><p>No submissions yet.</p></div>
                : (
                    <>
                        <div className="td-table-header td-grid-grading">
                            <span>Student</span>
                            <span>Submission</span>
                            <span>Status</span>
                            <span>Score / {currentAssignment?.max_score}</span>
                            <span>Feedback</span>
                            <span>Action</span>
                        </div>
                        <div className="td-table-body">
                            {submissions.map(sub => {
                                const formState = studentGradeForms[sub.id] || { 
                                    score: sub.score !== null ? sub.score : '', 
                                    feedback: sub.feedback || '' 
                                };
                                const isGraded = sub.status === "graded";
                                return (
                                    <div className="td-table-row td-grid-grading" key={sub.id}>
                                        <div className="td-user-info">
                                            <div className="td-avatar-sm">{getInitials(getStudentName(sub.student_id))}</div>
                                            <span>{getStudentName(sub.student_id)}</span>
                                        </div>
                                        <div className="td-cell">
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="td-link-btn">
                                                <ExternalLink size={14} /> View File
                                            </a>
                                        </div>
                                        <div className="td-cell">
                                            <span className={`td-status-badge ${isGraded ? 'success' : 'pending'}`}>
                                                {isGraded ? 'Graded' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="td-cell input-cell">
                                            <input 
                                                type="number" 
                                                className="td-input-small"
                                                placeholder="0" 
                                                max={currentAssignment?.max_score}
                                                value={formState.score} 
                                                onChange={e => handleGradeChange(sub.id, 'score', e.target.value)} 
                                            />
                                        </div>
                                        <div className="td-cell input-cell">
                                            <input 
                                                type="text" 
                                                className="td-input-small"
                                                placeholder="Feedback..." 
                                                value={formState.feedback} 
                                                onChange={e => handleGradeChange(sub.id, 'feedback', e.target.value)} 
                                            />
                                        </div>
                                        <div className="td-cell">
                                            <button className="td-btn-save" onClick={() => handleSaveGrade(sub.id)}>
                                                <Save size={14} /> Save
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}




function VideosPage({
        trainerCourses,
        selectedCourseId,
        setSelectedCourseId,
        videos,
        setVideos,
        apiHeaders,
        isVideosLoading,
        setIsVideosLoading
}) {
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [videoUrl, setVideoUrl] = useState("");
        const [newTitle, setNewTitle] = useState("");
        const [uploadProgress, setUploadProgress] = useState(0);
        const [searchTerm, setSearchTerm] = useState("");
        const [error, setError] = useState("");

        // Fetch videos when course changes
        useEffect(() => {
                if (!selectedCourseId) return;
                setIsVideosLoading(true);
                setError("");
                axios.get(`http://localhost:8000/courses/${selectedCourseId}/videos/`, apiHeaders)
                        .then(res => setVideos(res.data))
                        .catch(err => setError("Failed to fetch videos: " + (err.response?.data?.detail || err.message)))
                        .finally(() => setIsVideosLoading(false));
        }, [selectedCourseId, apiHeaders, setVideos, setIsVideosLoading]);

        // Upload video
        const handleUpload = async (e) => {
                e.preventDefault();
                if (!videoUrl || !newTitle) return alert("Enter title and video URL");
                setUploadProgress(0);
                setError("");
                try {
                        const res = await axios.post(
                                "http://localhost:8000/trainer/videos/",
                                {
                                        video_url: videoUrl,
                                        title: newTitle,
                                        course_id: selectedCourseId
                                },
                                {
                                        headers: apiHeaders.headers,
                                        onUploadProgress: e => setUploadProgress(Math.round((e.loaded * 100) / e.total))
                                }
                        );
                        alert("Video uploaded!");
                        setVideos(prev => [...prev, res.data]);
                        setVideoUrl("");
                        setNewTitle("");
                        setIsModalOpen(false);
                        setUploadProgress(0);
                } catch (err) {
                        setError("Upload failed: " + (err.response?.data?.detail || err.message));
                }
        };

        // Drag and drop reorder
        const handleDragEnd = result => {
                if (!result.destination) return;
                const reordered = Array.from(videos.filter(v => v.course_id === selectedCourseId));
                const [moved] = reordered.splice(result.source.index, 1);
                reordered.splice(result.destination.index, 0, moved);
                const newOrder = reordered.map((v, index) => ({ ...v, order: index }));
                setVideos(prev => prev.map(v => newOrder.find(n => n.id === v.id) || v));
        };

        const filteredVideos = videos
                .filter(v => v.course_id === selectedCourseId)
                .filter(v => v.title.toLowerCase().includes(searchTerm.toLowerCase()));

        // Video error state
        const [videoErrorIds, setVideoErrorIds] = useState([]);

        const handleVideoError = (id) => {
            setVideoErrorIds(prev => [...prev, id]);
        };

        return (
            <div className="td-page-container">
                <div className="td-header-section">
                    <div>
                        <h2 className="td-page-title">Course Videos</h2>
                        <p className="td-page-subtitle">Upload, reorder & manage videos</p>
                    </div>
                    <button className="td-btn-primary" disabled={!selectedCourseId} onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Upload Video
                    </button>
                </div>

                <div className="td-controls-bar">
                    <div className="td-control-group">
                        <label>Course</label>
                        <select className="td-select" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                            <option value="">Select a Course</option>
                            {trainerCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div className="td-control-group flex-grow">
                        <div className="td-search-wrapper">
                            <Search size={16} />
                            <input type="text" className="td-input-search" placeholder="Search videos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="td-table-card">
                    {!selectedCourseId ? (
                        <div className="td-empty-state"><p>Select a course to view videos.</p></div>
                    ) : isVideosLoading ? (
                        <div className="td-loading-state"><Loader className="td-spin" /> Loading...</div>
                    ) : error ? (
                        <div className="td-error-state"><AlertTriangle size={32} /> <p>{error}</p></div>
                    ) : filteredVideos.length === 0 ? (
                        <div className="td-empty-state"><p>No videos found.</p></div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="videos">
                                {provided => (
                                    <div className="td-video-grid" {...provided.droppableProps} ref={provided.innerRef}>
                                        {filteredVideos.map((video, index) => (
                                            <Draggable key={video.id} draggableId={String(video.id)} index={index}>
                                                {provided => (
                                                    <div className="td-video-card" ref={provided.innerRef} {...provided.draggableProps}>
                                                        <div className="td-card-top">
                                                            <div {...provided.dragHandleProps} style={{ cursor: "grab" }}>
                                                                <Menu size={18} />
                                                            </div>
                                                            <div className="flex-grow">
                                                                <h3 className="td-card-title">{video.title}</h3>
                                                            </div>
                                                        </div>
                                                        {videoErrorIds.includes(video.id) ? (
                                                            <div className="td-video-error">
                                                                <AlertTriangle size={20} style={{ color: '#e74c3c' }} />
                                                                <span>Video failed to load.</span>
                                                            </div>
                                                        ) : (
                                                            video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be') ? (
                                                                <iframe
                                                                    width="100%"
                                                                    height="240"
                                                                    src={
                                                                        video.video_url.includes('youtube.com/watch?v=')
                                                                            ? `https://www.youtube.com/embed/${video.video_url.split('v=')[1].split('&')[0]}`
                                                                            : video.video_url.includes('youtu.be/')
                                                                                ? `https://www.youtube.com/embed/${video.video_url.split('youtu.be/')[1].split('?')[0]}`
                                                                                : video.video_url
                                                                    }
                                                                    title="YouTube video"
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <video
                                                                    className="td-video-thumb"
                                                                    width="100%"
                                                                    controls
                                                                    src={video.video_url}
                                                                    onError={() => handleVideoError(video.id)}
                                                                >
                                                                    Your browser does not support the video tag.
                                                                </video>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </div>

                {/* Upload Modal */}
                {isModalOpen && (
                    <div className="td-modal-overlay">
                        <div className="td-modal-box">
                            <div className="td-modal-header">
                                <h3>Upload Video</h3>
                                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                            </div>
                            <form className="td-modal-form" onSubmit={handleUpload}>
                                <div className="td-form-group">
                                    <label>Title</label>
                                    <input type="text" className="td-input" required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                                </div>
                                <div className="td-form-group">
                                    <label>Video URL</label>
                                    <input type="text" className="td-input" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                                </div>
                                {uploadProgress > 0 && (
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                )}
                                <div className="td-modal-footer">
                                    <button type="button" className="td-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="td-btn-primary">Upload</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
}


// 3. Assignments Page
function AssignmentsPage({ assignments, trainerCourses, selectedCourseId, setModalType, setIsModalOpen }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [assignmentFilter, setAssignmentFilter] = useState('All');
    
    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        const now = new Date();
        const dueDate = new Date(a.due_date);
        if (assignmentFilter === 'Upcoming') return dueDate >= now;
        if (assignmentFilter === 'Past Due') return dueDate < now;
        return true;
    });
    
    const courseTitle = trainerCourses.find(c => c.id == selectedCourseId)?.title || 'Unknown Course';

    return (
        <div className="td-page-container">
            <div className="td-header-section">
                <div>
                    <h2 className="td-page-title">Assignments</h2>
                    <p className="td-page-subtitle">Create and manage tasks</p>
                </div>
                <button className="td-btn-primary" disabled={!selectedCourseId} onClick={() => { setModalType('assignment'); setIsModalOpen(true); }}>
                    <Plus size={18} /> New Assignment
                </button>
            </div>
            
            <div className="td-controls-bar">
                <div className="td-control-group flex-grow">
                    <div className="td-search-wrapper">
                        <Search size={16} />
                        <input type="text" className="td-input-search" placeholder="Search assignments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="td-tabs">
                    {['All', 'Upcoming', 'Past Due'].map(tab => (
                        <button key={tab} className={`td-tab ${assignmentFilter === tab ? 'active' : ''}`} onClick={() => setAssignmentFilter(tab)}>{tab}</button>
                    ))}
                </div>
            </div>

            <div className="td-cards-list">
                {filteredAssignments.length > 0 ? filteredAssignments.map(ass => {
                    const isPastDue = new Date(ass.due_date) < new Date();
                    return (
                        <div className="td-assignment-card" key={ass.id}>
                            <div className="td-card-top">
                                <div>
                                    <h3 className="td-card-title">{ass.title}</h3>
                                    <span className="td-card-subtitle">{courseTitle}</span>
                                </div>
                                <div className="td-card-actions">
                                    <button className="td-icon-btn"><Edit2 size={16} /></button>
                                    <button className="td-icon-btn danger"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="td-card-tags">
                                <span className={`td-status-badge ${isPastDue ? 'gray' : 'green'}`}>{isPastDue ? 'Closed' : 'Active'}</span>
                                <span className="td-points-badge">{ass.max_score} Points</span>
                            </div>
                            <div className="td-card-meta">
                                <span><Calendar size={14} /> Due: {formatDateTimeReadable(ass.due_date)}</span>
                                {ass.reference_material_url && (
                                    <a href={ass.reference_material_url} target="_blank" rel="noreferrer"><FileText size={14}/> Reference</a>
                                )}
                            </div>
                        </div>
                    );
                }) : <div className="td-empty-state"><p>No assignments found.</p></div>}
            </div>
        </div>
    );
}

// --- MAIN DASHBOARD COMPONENT ---
function TrainerDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [trainer, setTrainer] = useState(null);
    const [stats, setStats] = useState({ active_courses: 0, total_students: 0, pending_grading: 0, upcoming: 0 });
    
    // Data States
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [trainerCourses, setTrainerCourses] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [courseStudents, setCourseStudents] = useState([]);
    const [videos, setVideos] = useState([]);
    const [isVideosLoading, setIsVideosLoading] = useState(false);
    



    
    // UI States
    const [loading, setLoading] = useState(true);
    const [isCourseDataLoading, setIsCourseDataLoading] = useState(false);
    const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({});
    const [studentGradeForms, setStudentGradeForms] = useState({});

    const token = localStorage.getItem('token');
    const apiHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // Initial Load
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {          
                
                const [profileRes, statsRes, coursesRes, studentsRes] = await Promise.all([
                    axios.get('http://localhost:8000/trainer/profile', apiHeaders),
                    axios.get('http://localhost:8000/trainer/stats', apiHeaders),
                    axios.get('http://localhost:8000/trainer/courses', apiHeaders),
                    axios.get('http://localhost:8000/students', apiHeaders)
                ]);
                setTrainer(profileRes.data);
                setStats(statsRes.data);
                setTrainerCourses(coursesRes.data);
                setAllStudents(studentsRes.data);
                if (coursesRes.data.length > 0) setSelectedCourseId(coursesRes.data[0].id);
                
            } catch (err) { setError('Failed to load initial data.'); }
            finally { setLoading(false); }
        };
        fetchInitialData();
    }, [token, apiHeaders]);

    // Fetch Course Specific Data
    const fetchCourseSpecificData = useCallback(async () => {
        if (!selectedCourseId) return;
        setIsCourseDataLoading(true);
        try {
         
            const [assRes, attRes, studentsRes] = await Promise.all([
                axios.get(`http://localhost:8000/trainer/assignments/${selectedCourseId}`, apiHeaders),
                axios.get(`http://localhost:8000/trainer/attendance/${selectedCourseId}`, apiHeaders),
                axios.get(`http://localhost:8000/courses/${selectedCourseId}/students`, apiHeaders) 
            ]);
            setAssignments(assRes.data);
            setAttendance(attRes.data);
            setCourseStudents(studentsRes.data);
            setSubmissions([]); 
            setSelectedAssignmentId('');
            setStudentGradeForms({});
        } catch (err) { setError("Failed to load data for the selected course."); }
        finally { setIsCourseDataLoading(false); }
    }, [selectedCourseId, apiHeaders]);

    useEffect(() => { fetchCourseSpecificData(); }, [selectedCourseId, fetchCourseSpecificData]);

    // Fetch Submissions
    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedAssignmentId) return;
            setIsSubmissionsLoading(true);
            try {
                
              
                const res = await axios.get(`http://localhost:8000/trainer/assignments/${selectedAssignmentId}/submissions`, apiHeaders);
                setSubmissions(res.data);
                
                setStudentGradeForms({});
            } catch (err) { console.error("Error fetching submissions", err); } 
            finally { setIsSubmissionsLoading(false); }
        };
        fetchSubmissions();
    }, [selectedAssignmentId, apiHeaders]);



        const handleMarkAttendance = async (studentId, status, selectedDate) => {
        if (!selectedCourseId) { alert("Please select a course before marking attendance."); return; }
        const data = { student_id: studentId, course_id: parseInt(selectedCourseId, 10), date: selectedDate, status };
        try {
            const response = await axios.post('http://localhost:8000/trainer/attendance/', data, apiHeaders);
            setAttendance(prev => {
                const newAttendance = prev.filter(a => !(a.student_id === response.data.student_id && formatDate(a.date) === selectedDate));
                newAttendance.push(response.data);
                return newAttendance;
            });
        } catch (err) { alert("Failed to mark attendance."); }
    };

    // Updated: Grade based on Submission ID
    const handleSaveGrade = async (submissionId) => {
        const gradeData = studentGradeForms[submissionId];

        if (!gradeData) { alert("No changes to save."); return; }
        
        const scoreValue = String(gradeData.score).trim();
        if (scoreValue === '') { alert("Score cannot be empty."); return; }

        const payload = {
            submission_id: submissionId,
            score: parseFloat(scoreValue),
            feedback: gradeData.feedback || ""
        };

        try {
            // Updated Endpoint
            const res = await axios.put('http://localhost:8000/trainer/grade-submission/', payload, apiHeaders);
            alert("Grade submitted successfully!");
            
            // Update local state to reflect 'graded' status immediately
            setSubmissions(prev => prev.map(sub => sub.id === submissionId ? res.data : sub));
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message;
            alert("Error saving grade: " + errorDetail);
        }
    };
 

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        // Implementation remains same
        setIsModalOpen(false);
    };

    // --- RENDER ---
    const renderMainContent = () => {
        if (loading) return <div className="td-loading-full"><Loader size={48} /><p>Loading Dashboard...</p></div>;
        if (error) return <div className="td-error-state"><AlertTriangle size={48} /><p>{error}</p></div>;
        
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="td-dashboard-overview">
                        <div className="td-welcome-banner">
                            <h1>Welcome back, {trainer?.name.split(' ')[0]}!</h1>
                            <p>Here's what's happening with your courses today.</p>
                        </div>
                        <div className="td-stats-grid">
                            <div className="td-stat-card td-blue">
                                <div className="td-stat-icon"><Users size={24} /></div>
                                <div className="td-stat-info">
                                    <span className="td-count">{stats.active_courses}</span>
                                    <span className="td-label">Active Students</span>
                                </div>
                            </div>
                            <div className="td-stat-card td-purple">
                                <div className="td-stat-icon"><BookOpen size={24} /></div>
                                <div className="td-stat-info">
                                    <span className="td-count">{stats.total_students}</span>
                                    <span className="td-label">Active Courses</span>
                                </div>
                            </div>
                            <div className="td-stat-card td-green">
                                <div className="td-stat-icon"><FileText size={24} /></div>
                                <div className="td-stat-info">
                                    <span className="td-count">{stats.pending_grading}</span>
                                    <span className="td-label">Assignments</span>
                                </div>
                            </div>
                            <div className="td-stat-card td-orange">
                                <div className="td-stat-icon"><AlertIcon size={24} /></div>
                                <div className="td-stat-info">
                                    <span className="td-count">{stats.upcoming}</span>
                                    <span className="td-label">Pending Reviews</span>
                                </div>
                                <div className="td-stat-trend">Action needed</div>
                            </div>
                        </div>
                        
                        {/* Quick Actions / Recent Activity Section could go here */}
                    </div>
                );
            case 'grades':
                return <GradesPage
                    allStudents={allStudents}
                    trainerCourses={trainerCourses}
                    assignments={assignments}
                    submissions={submissions}
                    selectedCourseId={selectedCourseId}
                    setSelectedCourseId={setSelectedCourseId}
                    selectedAssignmentId={selectedAssignmentId}
                    setSelectedAssignmentId={setSelectedAssignmentId}
                    isSubmissionsLoading={isSubmissionsLoading}
                    handleSaveGrade={handleSaveGrade}
                    studentGradeForms={studentGradeForms}
                    setStudentGradeForms={setStudentGradeForms}
                />;
            case 'assignments':
                return <AssignmentsPage assignments={assignments} trainerCourses={trainerCourses} selectedCourseId={selectedCourseId} setModalType={setModalType} setIsModalOpen={setIsModalOpen} />;
            case 'attendance':
                return <AttendancePage 
                    attendance={attendance} 
                    courseStudents={courseStudents} 
                    trainerCourses={trainerCourses} 
                    selectedCourseId={selectedCourseId} 
                    setSelectedCourseId={setSelectedCourseId} 
                    isCourseDataLoading={isCourseDataLoading} 
                    handleMarkAttendance={handleMarkAttendance} 
                />;

            case 'videos':
                return <VideosPage
                    trainerCourses={trainerCourses}
                    selectedCourseId={selectedCourseId}
                    setSelectedCourseId={setSelectedCourseId}
                    videos={videos}
                    setVideos={setVideos}
                    apiHeaders={apiHeaders}
                    isVideosLoading={isVideosLoading}
                    setIsVideosLoading={setIsVideosLoading}
                    loading={loading}
                    setLoading={setLoading}
                />;
            default: return null;
        }
    };

    return (
        <div className="td-layout-wrapper">
            <aside className="td-sidebar">
                <div className="td-sidebar-header">
                    <div className="td-logo">
                        <BookOpen size={20} />
                    </div>
                     <div className="brand-text">
            <h2>Learning Management</h2>
            <span>System</span>
          </div>
                </div>
                <nav className="td-nav-menu">
                    <p className="td-nav-label">Main Menu</p>
                    <button className={`td-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <Home size={18} /> <span>Dashboard</span>
                    </button>
                    <button className={`td-nav-item ${activeTab === 'grades' ? 'active' : ''}`} onClick={() => setActiveTab('grades')}>
                        <Award size={18} /> <span>Grades</span>
                    </button>
                     <button className={`td-nav-item ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
                        <Award size={18} /> <span>Course Videos</span>
                    </button>
                    <button className={`td-nav-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
                        <FileText size={18} /> <span>Assignments</span>
                    </button>
                    <button className={`td-nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                        <Clipboard size={18} /> <span>Attendance</span>
                    </button>
                </nav>
                <div className="td-sidebar-footer">
                    {trainer && (
                        <div className="td-user-badge">
                            <div className="td-avatar-xs">{getInitials(trainer.name)}</div>
                            <div className="td-user-details">
                                <span className="td-name">{trainer.name}</span>
                                <span className="td-role">Trainer</span>
                            </div>
                        </div>
                    )}
                    <button 
                       className="td-logout-btn" 
                       onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
                     >
                       <LogOut size={18} />
                       <span>Sign Out</span>
                     </button>
                </div>
            </aside>
            
            <main className="td-main-content">
                <header className="td-topbar">
                    <div className="td-breadcrumbs">Portal / {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</div>
                    <div className="td-topbar-actions">
                        <div className="td-date-display">{new Date().toLocaleDateString()}</div>
                    </div>
                </header>
                <div className="td-content-area">
                    {renderMainContent()}
                </div>
            </main>
            
            {/* Modal */}
            {isModalOpen && (
                <div className="td-modal-overlay">
                    <div className="td-modal-box">
                        <div className="td-modal-header">
                            <h3>Create Assignment</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form className="td-modal-form" onSubmit={handleModalSubmit}>
                            <div className="td-form-group">
                                <label>Title</label>
                                <input type="text" className="td-input" required value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="td-form-group">
                                <label>Description</label>
                                <textarea className="td-input textarea" required value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="td-row-split">
                                <div className="td-form-group">
                                    <label>Due Date</label>
                                    <input type="datetime-local" className="td-input" required value={formData.due_date || ""} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                </div>
                                <div className="td-form-group">
                                    <label>Max Score</label>
                                    <input type="number" className="td-input" required value={formData.max_score || ""} onChange={e => setFormData({ ...formData, max_score: e.target.value })} />
                                </div>
                            </div>
                            <div className="td-modal-footer">
                                <button type="button" className="td-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="td-btn-primary">Create Assignment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TrainerDashboard;