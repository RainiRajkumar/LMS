import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRef } from 'react';
import axios from 'axios';
import {
    Home, Book, CheckSquare, Award, Clipboard, User, Users, Calendar, LogOut, Plus, Loader,
    AlertTriangle, CheckCircle, Clock, Search, BookOpen, Upload, ExternalLink, X, FileText,
    Download, Cpu
} from 'react-feather';
import { MessageCircle, Send, ChevronRight, Mic, MicOff, Volume2, VolumeX, IndianRupee } from 'lucide-react';
import './StudentDashboard.css';
import GoogleCalenderAttendance from './GoogleCalenderAttendance';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generatePaymentReceipt } from "../utils/generatePaymentReceipt";

// --- YOUTUBE PLAYER COMPONENT FOR COMPLETION TRACKING ---
function YouTubePlayer({ videoId, onComplete }) {
    const playerRef = useRef(null);
    useEffect(() => {
        // Load YouTube IFrame API if not loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
        }
        let player;
        window.onYouTubeIframeAPIReady = () => {
            player = new window.YT.Player(playerRef.current, {
                videoId,
                events: {
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onComplete();
                        }
                    }
                }
            });
        };
        // If API already loaded
        if (window.YT && window.YT.Player) {
            player = new window.YT.Player(playerRef.current, {
                videoId,
                events: {
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onComplete();
                        }
                    }
                }
            });
        }
        return () => {
            if (player) player.destroy && player.destroy();
        };
    }, [videoId, onComplete]);
    return <div ref={playerRef} style={{ width: '100%', height: 240 }} />;
}

const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    // Adjust for timezone to prevent day shifting
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(d.getTime() - userTimezoneOffset);
    return adjustedDate.toISOString().split('T')[0];
};

const formatDateTimeReadable = (isoString) => {
    if (!isoString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString(undefined, options);
};

const getLetterGrade = (score, maxScore) => {
    if (score === null || score === undefined || !maxScore) return '-';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
};

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

function StudentDashboard() {
        // Example: Track watched/completed videos (simulate with localStorage or state)
        const [watchedVideos, setWatchedVideos] = useState(() => {
            const saved = localStorage.getItem('watchedVideos');
            return saved ? JSON.parse(saved) : {};
        });

        // Mark video as watched (simulate)
        const markVideoWatched = (videoId) => {
            setWatchedVideos(prev => {
                const updated = { ...prev, [videoId]: true };
                localStorage.setItem('watchedVideos', JSON.stringify(updated));
                return updated;
            });
        };
    const [activeTab, setActiveTab] = useState('dashboard');

    // --- STATE ---
    const [student, setStudent] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [allCourses, setAllCourses] = useState([]);

    // Course Specific Data
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]); // Stores data from /student/submissions/
    const [attendance, setAttendance] = useState([]);


    const [showPayment, setShowPayment] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('UPI');

    // UI states
    const [loading, setLoading] = useState(true);
    const [isCourseDataLoading, setIsCourseDataLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');


    // Video Content State
    const [videos, setVideos] = useState([]);
    const [isVideosLoading, setIsVideosLoading] = useState(false);
    const [videoErrorIds, setVideoErrorIds] = useState([]);


    // Submission Modal State
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [submissionForm, setSubmissionForm] = useState({ file_url: '', comments: '' });

    const token = localStorage.getItem('token');
    const apiHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
    // --- PAYMENT INPUT STATE (UI ONLY) ---
    const [paymentForm, setPaymentForm] = useState({
        upiId: '',
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: '',
        bankName: 'HDFC',
        accountHolder: '',
        accountNumber: '',
        ifsc: ''
    });

    const handleFormChange = (e) => {
        setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    };

    const API_KEY = "AIzaSyAxKnfyAkMe9Zq_CdeIVdMIKdzTQ4sRAVk";



    const [quote, setQuote] = useState("Loading today's focus...");
    const [quoteLoading, setQuoteLoading] = useState(true);

    useEffect(() => {
        const fetchDailyQuote = async () => {
            const todayDate = new Date().toDateString();
            const savedData = localStorage.getItem("dailyFocus");

            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData.date === todayDate) {
                    setQuote(parsedData.text);
                    setQuoteLoading(false);
                    return;
                }
            }

            try {
                // Gemini API client usage (adjust to your actual client)
                const genAI = new GoogleGenerativeAI(API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const prompt = "Give me one short, powerful, unique motivational quote for a student learning coding. Do not include the author name. Do not include quotation marks.";

                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/"/g, "");

                localStorage.setItem(
                    "dailyFocus",
                    JSON.stringify({ date: todayDate, text: responseText })
                );

                setQuote(responseText);
            } catch (error) {
                console.error("Error fetching quote:", error);
                setQuote("Keep pushing forward!"); // Fallback quote
            } finally {
                setQuoteLoading(false);
            }
        };

        fetchDailyQuote();
    }, []);

    const [aiHistory, setAiHistory] = useState([]);
    const [newQueryText, setNewQueryText] = useState("");
    const [selectedChat, setSelectedChat] = useState(null);
    const [isAIGenerating, setIsAIGenerating] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [selectedLanguage, setSelectedLanguage] = useState("en-US");
    const [voiceSpeed, setVoiceSpeed] = useState(1);
    const [isVoiceMode, setIsVoiceMode] = useState(false); // default: false


    // const studentId = loggedInStudentId; // <-- Replace with real student ID

    useEffect(() => {
        setSpeechSupported("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    }, []);

    // 2. Load History ONLY after 'student' data is loaded
    useEffect(() => {
        if (student) {
            loadHistory();
        }
    }, [student]); // Dependency ensures this runs once 'student' is not null

    // --- FUNCTIONS ---

    const loadHistory = async () => {
        // Safety check: ensure student exists and has an ID
        // Note: Check your API response. It is usually 'student.id' or 'student.student_id'
        const currentStudentId = student.student_id || student.id;

        if (!currentStudentId) return;

        try {
            const res = await fetch(`http://localhost:8000/student/history/${currentStudentId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }); if (res.ok) {
                const data = await res.json();
                setAiHistory(data.reverse());
            }
        } catch (err) {
            console.error("Failed to load AI history", err);
        }
    };

    const handleSubmitQuery = async () => {
        if (!newQueryText.trim() || !student) return;

        const currentStudentId = student.studentId || student.id;

        setIsAIGenerating(true);

        try {
            const res = await axios.post(
                "http://localhost:8000/student/ask/",
                {
                    student_id: currentStudentId,
                    query: newQueryText,
                    language: selectedLanguage,
                    voice_mode: isVoiceMode,     
                },
                apiHeaders
            );

            // Update history
            setAiHistory(prev => [res.data, ...prev]);
            setNewQueryText("");
        } catch (err) {
            console.error("Error asking AI:", err.response?.data || err.message);
            alert("AI failed to respond. Please try again.");
        } finally {
            setIsAIGenerating(false);
        }
    };

    let recognition;

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (e) => {
            setNewQueryText(e.results[0][0].transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);

        recognition.start();
    };

    const stopListening = () => {
        recognition.stop();
        setIsListening(false);
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLanguage;
        utterance.rate = voiceSpeed;
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };


    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch Profile, Enrollments, and Catalog
                const [profileRes, enrolledRes, allCoursesRes] = await Promise.all([
                    axios.get('http://localhost:8000/student/profile', apiHeaders),
                    axios.get('http://localhost:8000/student/enrollments', apiHeaders),
                    axios.get('http://localhost:8000/student/courses', apiHeaders)
                ]);
                setStudent(profileRes.data);
                setEnrolledCourses(enrolledRes.data);
                setAllCourses(allCoursesRes.data);

                // Auto-select first course if available
                if (enrolledRes.data.length > 0) {
                    setSelectedCourseId(enrolledRes.data[0].course_id);
                }

            } catch (err) {
                setError('Failed to load initial dashboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [token, apiHeaders]);

    // --- COURSE DATA FETCH ---
    const fetchCourseSpecificData = useCallback(async () => {
        if (!selectedCourseId) return;
        setIsCourseDataLoading(true);
        try {
            // UPDATED: Now calling /student/submissions instead of grades
            const [assRes, subRes, attRes] = await Promise.all([
                axios.get(`http://localhost:8000/student/assignments/${selectedCourseId}`, apiHeaders),
                axios.get(`http://localhost:8000/student/submissions/${selectedCourseId}`, apiHeaders),
                axios.get(`http://localhost:8000/student/attendance/${selectedCourseId}`, apiHeaders)
            ]);
            setAssignments(assRes.data);
            console.log(assRes.data);
            setSubmissions(subRes.data);
            setAttendance(attRes.data);
        } catch (err) {
            console.error("Error fetching course data", err);
            // Optional: setError("Failed to load course data");
        } finally {
            setIsCourseDataLoading(false);
        }
    }, [selectedCourseId, apiHeaders]);

    useEffect(() => {
        // If course is selected, fetch its data
        fetchCourseSpecificData();
    }, [selectedCourseId, fetchCourseSpecificData]);

    //--- HANDLERS ---

    const handleEnroll = async (courseId) => {
        // Find course fee and set in selectedEnrollment
        const course = allCourses.find(c => c.id === courseId);
        setSelectedEnrollment({
            course_id: courseId,
            amount: course ? course.course_fee : '',
        });
        setShowPayment(true);
    };


    const makePayment = async () => {
        if (!selectedEnrollment) return;
        // --- VALIDATION ---
        let errorMsg = '';
        if (!selectedEnrollment.amount || isNaN(selectedEnrollment.amount) || Number(selectedEnrollment.amount) <= 0) {
            errorMsg = 'Invalid or missing amount.';
        } else if (paymentMethod === 'UPI') {
            if (!paymentForm.upiId || !/^\w+@\w+$/.test(paymentForm.upiId)) {
                errorMsg = 'Please enter a valid UPI ID (e.g., username@bank).';
            }
        } else if (paymentMethod === 'CARD') {
            if (!/^\d{16}$/.test(paymentForm.cardNumber.replace(/\s/g, ''))) {
                errorMsg = 'Card number must be 16 digits.';
            } else if (!paymentForm.cardName.trim()) {
                errorMsg = 'Name on card is required.';
            } else if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) {
                errorMsg = 'Expiry must be in MM/YY format.';
            } else if (!/^\d{3}$/.test(paymentForm.cvv)) {
                errorMsg = 'CVV must be 3 digits.';
            }
        } else if (paymentMethod === 'NETBANKING') {
            if (!paymentForm.bankName) {
                errorMsg = 'Please select a bank.';
            } else if (!paymentForm.accountHolder.trim()) {
                errorMsg = 'Account holder name is required.';
            } else if (!/^\d{9,18}$/.test(paymentForm.accountNumber)) {
                errorMsg = 'Account number must be 9-18 digits.';
            } else if (!/^\w{4}\d{7}$/.test(paymentForm.ifsc)) {
                errorMsg = 'IFSC must be 4 letters followed by 7 digits.';
            }
        }
        if (errorMsg) {
            alert(errorMsg);
            return;
        }
        // --- END VALIDATION ---
        try {
            // 1. Enroll the student (get enrollment id and amount)
            const enrollRes = await axios.post('http://localhost:8000/student/enroll', { course_id: selectedEnrollment.course_id }, apiHeaders);
            const enrollmentData = enrollRes.data;
            // 2. Make payment
            const res = await axios.post(
                'http://localhost:8000/payment/pay',
                {
                    enrollment_id: enrollmentData.id,
                    amount: enrollmentData.course_fee_amount,
                    payment_method: paymentMethod
                },
                apiHeaders
            );
            alert('Payment Successful! Transaction ID: ' + res.data.transaction_id);

            // Generate PDF receipt
            try {
                await generatePaymentReceipt({
                    studentName: student?.name || '',
                    courseTitle: allCourses.find(c => c.id === selectedEnrollment.course_id)?.title || '',
                    amount: res.data.amount || enrollmentData.course_fee_amount || selectedEnrollment.amount,
                    paymentMethod: res.data.payment_method,
                    transactionId: res.data.transaction_id,
                    paidOn: formatDate(res.data.paid_on),
                    enrollmentId: res.data.enrollment_id,
                    courseId: res.data.course_id
                });
            } catch (err) {
                alert("PDF generation failed. Please try again.");
            }

            setShowPayment(false);
            // Refresh enrollments
            const [enrolledRes] = await Promise.all([
                axios.get('http://localhost:8000/student/enrollments', apiHeaders)
            ]);
            setEnrolledCourses(enrolledRes.data);
        } catch (err) {
            alert('Payment or Enrollment failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const openSubmitModal = (assignment) => {
        console.log("selected assignment:", assignment)

        if (!assignment.id) {
            alert("Error: This assignment is missing an ID. please contact the trainer.");
            return
        }
        setCurrentAssignment(assignment);
        setSubmissionForm({ file_url: '', comments: '' });
        setIsSubmitModalOpen(true);
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                assignment_id: currentAssignment.id,
                file_url: submissionForm.file_url,
                comments: submissionForm.comments
            };
            console.log(payload)
            await axios.post('http://localhost:8000/student/submit/', payload, apiHeaders);
            alert("Assignment submitted successfully!");
            setIsSubmitModalOpen(false);
            fetchCourseSpecificData(); // Refresh to see the new submission status
        } catch (err) {
            alert("Submission failed: " + (err.response?.data?.detail || err.message));
        }
    };

    // --- VIEWS ---

    useEffect(() => {
    if (!selectedCourseId) return;
    setIsVideosLoading(true);
    axios.get(`http://localhost:8000/courses/${selectedCourseId}/videos/`, apiHeaders)
        .then(res => setVideos(res.data))
        .catch(() => setVideos([]))
        .finally(() => setIsVideosLoading(false));
}, [selectedCourseId, apiHeaders]);


const handleVideoError = (id) => {
    setVideoErrorIds(prev => [...prev, id]);
};

const getCourseProgress = () => {
    const total = assignments.length;
    const completed = submissions.filter(s => s.score !== null).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
};

    const renderVideosTab = () => (
        <div className="management-page">
            <div className="management-header"><h2>Course Videos</h2><p>Watch course videos and track your progress</p></div>
            {renderCourseSelector()}
            <div style={{ margin: '24px 0' }}>
                <label style={{ fontWeight: 600, fontSize: '1rem', color: '#374151' }}>Course Progress</label>
                <div style={{ background: '#f3f4f6', borderRadius: '12px', height: '32px', width: '100%', marginTop: '8px', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{
                        width: `${getCourseProgress()}%`,
                        background: 'linear-gradient(90deg, #4361ee 0%, #4cc9f0 100%)',
                        height: '100%',
                        borderRadius: '12px',
                        transition: 'width 0.4s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        paddingRight: '16px',
                        boxShadow: '0 2px 8px rgba(67,97,238,0.08)'
                    }}>
                        {getCourseProgress()}%
                    </div>
                </div>
            </div>
            {isVideosLoading ? <div className="loading-state"><Loader /></div> : (
                <div className="td-table-card">
                    <div className="td-video-grid">
                        {videos.length > 0 ? videos.map(video => {
                            const videoProgress = watchedVideos[video.id] ? 100 : 0;
                            // Extract YouTube videoId
                            let youtubeId = null;
                            if (video.video_url.includes('youtube.com/watch?v=')) {
                                youtubeId = video.video_url.split('v=')[1].split('&')[0];
                            } else if (video.video_url.includes('youtu.be/')) {
                                youtubeId = video.video_url.split('youtu.be/')[1].split('?')[0];
                            }
                            return (
                                <div className="td-video-card" key={video.id}>
                                    <div className="td-card-top">
                                        <h3 className="td-card-title">{video.title}</h3>
                                    </div>
                                    {/* Video Progress Bar */}
                                    <div style={{ margin: '8px 0 16px 0' }}>
                                        <label style={{ fontSize: '0.9rem', color: '#374151' }}>Progress</label>
                                        <div style={{ background: '#f3f4f6', borderRadius: '8px', height: '12px', width: '100%', marginTop: '4px', position: 'relative' }}>
                                            <div style={{
                                                width: `${videoProgress}%`,
                                                background: videoProgress === 100 ? 'linear-gradient(90deg, #05cd99 0%, #4cc9f0 100%)' : 'linear-gradient(90deg, #4361ee 0%, #4cc9f0 100%)',
                                                height: '100%',
                                                borderRadius: '8px',
                                                transition: 'width 0.4s',
                                            }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{videoProgress}% {videoProgress === 100 ? 'Completed' : 'Not Started'}</div>
                                    </div>
                                    {videoErrorIds.includes(video.id) ? (
                                        <div className="td-video-error">
                                            <AlertTriangle size={20} style={{ color: '#e74c3c' }} />
                                            <span>Video failed to load.</span>
                                        </div>
                                    ) : (
                                        youtubeId ? (
                                            <YouTubePlayer videoId={youtubeId} onComplete={() => markVideoWatched(video.id)} />
                                        ) : (
                                            <video
                                                className="td-video-thumb"
                                                width="100%"
                                                controls
                                                src={video.video_url}
                                                onError={() => handleVideoError(video.id)}
                                                onEnded={() => markVideoWatched(video.id)}
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        )
                                    )}
                                </div>
                            );
                        }) : <div className="td-empty-state"><p>No videos found for this course.</p></div>}
                    </div>
                </div>
            )}
        </div>
    );


    const renderCourseSelector = () => (
        <div className="filter-bar">
            <div>
                <label>Select Course</label>
                <select onChange={(e) => setSelectedCourseId(e.target.value)} value={selectedCourseId}>
                    {enrolledCourses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_title}</option>)}
                </select>
            </div>
        </div>
    );
    const renderDashboard = () => {
        // Calculate stats
        const gradedCount = submissions.filter(s => s.score !== null).length;
        const pendingAssignments = assignments.length - submissions.length;

        return (
            <div className="content-area-padded">
                <h2 style={{ marginBottom: '24px', fontSize: '1.25rem', color: '#4b5563' }}>Overview</h2>

                <div className="stats-cards-grid">

                    {/* CARD 1: Enrolled Courses */}
                    <div className="stat-card blue">
                        <div className="stat-content">
                            <span>Enrolled Courses</span>
                            <h3>{enrolledCourses.length}</h3>
                            <span>Active enrollments</span>
                        </div>
                        <div className="stat-icon-wrapper">
                            <BookOpen size={22} />
                        </div>
                    </div>

                    {/* CARD 2: Pending Tasks */}
                    <div className="stat-card purple">
                        <div className="stat-content">
                            <span>To-Do List</span>
                            <h3>{pendingAssignments < 0 ? 0 : pendingAssignments}</h3>
                            <span>Assignments pending</span>
                        </div>
                        <div className="stat-icon-wrapper">
                            <CheckSquare size={22} />
                        </div>

                    </div>

                    {/* CARD 3: Graded */}
                    <div className="stat-card green">
                        <div className="stat-content">
                            <span>Completed</span>
                            <h3>{gradedCount}</h3>
                            <span>Graded assignments</span>

                        </div>
                        <div className="stat-icon-wrapper">
                            <Award size={22} />
                        </div>

                    </div>

                    {/* CARD 4: Attendance */}
                    <div className="stat-card orange">
                        <div className="stat-content">
                            <span>Attendance</span>
                            <h3>
                                {attendance.length > 0 ? '92%' : 'N/A'}
                            </h3>
                            <span>Current attendance rate</span>

                        </div>
                        <div className="stat-icon-wrapper">
                            <Clipboard size={22} />
                        </div>
                    </div>

                </div>

                <div style={{ marginTop: '32px', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>🎓 Today's Focus</h3>
                    {quoteLoading ? (
                        // Simple loading skeleton
                        <div style={{ height: '20px', background: '#f3f4f6', borderRadius: '4px', width: '80%', animation: 'pulse 2s infinite' }}></div>
                    ) : (
                        <p style={{ color: '#6b7280', lineHeight: '1.6', fontStyle: 'italic' }}>
                            "{quote}"
                        </p>
                    )}

                </div>





            </div>
        );
    };


    // 2. ASSIGNMENTS
    const renderAssignments = () => (
        <div className="management-page">
            <div className="management-header"><h2>Assignments</h2><p>View tasks and submit your work</p></div>
            {renderCourseSelector()}

            {isCourseDataLoading ? <div className="loading-state"><Loader /></div> : (
                <div className="cards-list">
                    {assignments.length > 0 ? assignments.map(ass => {
                        // Find if this student has submitted
                        const mySubmission = submissions.find(s => s.assignment_id === ass.id);
                        const isPastDue = new Date(ass.due_date) < new Date();
                        const isSubmitted = !!mySubmission;
                        const isGraded = mySubmission?.status === 'graded'; // or check if score is not null

                        return (
                            <div className="content-card" key={ass.id}>
                                <div className="card-header-row">
                                    <h3>{ass.title}</h3>

                                    {/* STATUS BADGES / ACTION BUTTONS */}
                                    {isGraded ? (
                                        <span className="badge green">Graded: {mySubmission.score}/{ass.max_score}</span>
                                    ) : isSubmitted ? (
                                        <span className="badge blue">Submitted</span>
                                    ) : isPastDue ? (
                                        <span className="badge gray">Past Due</span>
                                    ) : (
                                        <button className="btn-primary" onClick={() => openSubmitModal(ass)}>
                                            <Upload size={14} /> Submit Now
                                        </button>
                                    )}
                                </div>

                                <p className="course-description">{ass.description}</p>

                                <div className="meta-info-row">
                                    <span><Calendar size={14} /> Due: {formatDateTimeReadable(ass.due_date)}</span>
                                    <span><Award size={14} /> Max Points: {ass.max_score}</span>
                                </div>

                                {/* Reference Material */}
                                {ass.reference_material_url && (
                                    <div className="reference-link">
                                        <a href={ass.reference_material_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink size={14} /> Reference Material
                                        </a>
                                    </div>
                                )}

                                {/* Submission Preview */}
                                {isSubmitted && (
                                    <div className="submission-preview">
                                        <div className="preview-header"><CheckCircle size={14} /> Work Submitted on {formatDate(mySubmission.submitted_at)}</div>
                                        <a href={mySubmission.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                                            View My File <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    }) : <div className="empty-state"><p>No assignments found for this course.</p></div>}
                </div>
            )}
        </div>
    );

    // --- PAYMENT MODAL RENDERER ---
    const renderPaymentModal = () => {
        if (!showPayment || !selectedEnrollment) return null;

        const courseTitle = allCourses.find(c => c.id === selectedEnrollment.course_id)?.title || 'Selected Course';

        // Styles for inputs to keep JSX clean
        const inputStyle = {
            width: '100%',
            padding: '10px',
            marginTop: '5px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '0.9rem'
        };

        const labelStyle = {
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#374151',
            marginTop: '12px',
            display: 'block'
        };

        return (
            <div className="modal-backdrop">
                <div className="modal" style={{ maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>

                    {/* Header */}
                    <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '50%', color: '#4f46e5' }}>
                                <IndianRupee size={20} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Secure Payment</h2>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Complete your enrollment</span>
                            </div>
                        </div>
                        <button onClick={() => setShowPayment(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={24} color="#6b7280" />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '20px 0' }}>

                        {/* Summary Card */}
                        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#6b7280' }}>COURSE</p>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>{courseTitle}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                                <span style={{ fontWeight: '600', color: '#374151' }}>Total Amount:</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4f46e5' }}>₹{selectedEnrollment.amount}</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '0.9rem' }}>Select Payment Method</label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            {['UPI', 'CARD', 'NETBANKING'].map((method) => (
                                <div
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '10px',
                                        border: `1px solid ${paymentMethod === method ? '#4f46e5' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: paymentMethod === method ? '#eef2ff' : 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: paymentMethod === method ? '600' : '400',
                                        color: paymentMethod === method ? '#4f46e5' : '#374151'
                                    }}
                                >
                                    {method === 'CARD' ? 'Card' : method === 'NETBANKING' ? 'NetBanking' : method}
                                </div>
                            ))}
                        </div>

                        {/* --- DYNAMIC FORM FIELDS --- */}
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px' }}>

                            {/* 1. UPI SECTION */}
                            {paymentMethod === 'UPI' && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ marginBottom: '15px', padding: '10px', background: 'white', display: 'inline-block', border: '1px dashed #ccc' }}>
                                        {/* Fake QR Code */}
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pay?pa=edu@bank&am=${selectedEnrollment.amount}`} alt="UPI QR" style={{ display: 'block' }} />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 15px 0' }}>Scan with any UPI App</p>

                                    <div style={{ textAlign: 'left' }}>
                                        <label style={labelStyle}>Or enter UPI ID / VPA</label>
                                        <input
                                            type="text"
                                            name="upiId"
                                            placeholder="username@bank"
                                            value={paymentForm.upiId}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 2. CARD SECTION */}
                            {paymentMethod === 'CARD' && (
                                <div>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Card Number</label>
                                    <input type="text" name="cardNumber" maxLength="16" placeholder="0000 0000 0000 0000" value={paymentForm.cardNumber} onChange={handleFormChange} style={inputStyle} />

                                    <label style={labelStyle}>Name on Card</label>
                                    <input type="text" name="cardName" placeholder="JOHN DOE" value={paymentForm.cardName} onChange={handleFormChange} style={inputStyle} />

                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>Expiry Date</label>
                                            <input type="text" name="expiry" placeholder="MM/YY" maxLength="5" value={paymentForm.expiry} onChange={handleFormChange} style={inputStyle} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={labelStyle}>CVV</label>
                                            <input type="password" name="cvv" placeholder="123" maxLength="3" value={paymentForm.cvv} onChange={handleFormChange} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. NETBANKING SECTION */}
                            {paymentMethod === 'NETBANKING' && (
                                <div>
                                    <label style={{ ...labelStyle, marginTop: 0 }}>Select Bank</label>
                                    <select name="bankName" value={paymentForm.bankName} onChange={handleFormChange} style={inputStyle}>
                                        <option value="HDFC">HDFC Bank</option>
                                        <option value="SBI">State Bank of India</option>
                                        <option value="ICICI">ICICI Bank</option>
                                        <option value="AXIS">Axis Bank</option>
                                    </select>

                                    <label style={labelStyle}>Account Holder Name</label>
                                    <input type="text" name="accountHolder" placeholder="Name as per bank records" value={paymentForm.accountHolder} onChange={handleFormChange} style={inputStyle} />

                                    <label style={labelStyle}>Account Number</label>
                                    <input type="text" name="accountNumber" placeholder="XXXXXXXXXXXX" value={paymentForm.accountNumber} onChange={handleFormChange} style={inputStyle} />

                                    <label style={labelStyle}>IFSC Code</label>
                                    <input type="text" name="ifsc" placeholder="ABCD0123456" maxLength="11" value={paymentForm.ifsc} onChange={handleFormChange} style={{ ...inputStyle, textTransform: 'uppercase' }} />
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="modal-actions" style={{ marginTop: '0' }}>
                        <button className="cancel-btn" onClick={() => setShowPayment(false)}>Cancel</button>
                        <button className="submit-btn" onClick={makePayment} style={{ width: '100%', justifyContent: 'center' }}>
                            Pay ₹ {selectedEnrollment.amount}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // 3. GRADES (Derived from Submissions)
    const renderGrades = () => {
        // Filter submissions that have a score
        const gradedSubmissions = submissions.filter(s => s.score !== null);

        return (
            <div className="management-page">
                <div className="management-header"><h2>My Grades</h2><p>Feedback and scores from your trainer</p></div>
                {renderCourseSelector()}

                {isCourseDataLoading ? <div className="loading-state"><Loader /></div> : (
                    <div className="attendance-list"> {/* Using list style for grades table */}
                        <div className="attendance-header grid-grades">
                            <span>Assignment</span>
                            <span>Submitted</span>
                            <span>Grade</span>
                            <span>Feedback</span>
                        </div>

                        {gradedSubmissions.length > 0 ? gradedSubmissions.map(sub => {
                            const assignment = assignments.find(a => a.id === sub.assignment_id);
                            const maxScore = assignment ? assignment.max_score : 100;
                            const letterGrade = getLetterGrade(sub.score, maxScore);

                            return (
                                <div className="student-row grid-grades" key={sub.id}>
                                    <div className="student-info">
                                        <span>{assignment ? assignment.title : `Assignment #${sub.assignment_id}`}</span>
                                    </div>

                                    <span>{formatDate(sub.submitted_at)}</span>

                                    <div className="grade-score">
                                        <span className={`grade-badge ${letterGrade === 'F' ? 'red' : 'green'}`}>
                                            {letterGrade}
                                        </span>
                                        <strong>{sub.score}</strong> / {maxScore}
                                    </div>

                                    <span className="feedback-text">{sub.feedback || "No feedback provided."}</span>
                                </div>
                            );
                        }) : <div className="empty-state"><p>No grades available yet.</p></div>}
                    </div>
                )}
            </div>
        );
    };

    // 4. ATTENDANCE
    const renderAttendance = () => {
        const attendanceByDate = attendance.reduce((acc, record) => {
            const date = formatDate(record.date);
            if (!acc[date]) acc[date] = [];
            acc[date].push(record);
            return acc;
        }, {});

        return (
            <div className="management-page">
                <div className="management-header"><h2>Attendance Record</h2></div>
                {renderCourseSelector()}

                {isCourseDataLoading ? <div className="loading-state"><Loader /></div> : (
                    <>
                        <GoogleCalenderAttendance attendance={attendance} />

                        <div className="attendance-list" style={{ marginTop: '2rem' }}>
                            <div className="attendance-header"><span>Date</span><span>Status</span></div>
                            {Object.keys(attendanceByDate).sort().reverse().map(date => {
                                const record = attendanceByDate[date][0];
                                return (
                                    <div className="student-row" key={record.id}>
                                        <span>{date}</span>
                                        <span className={`status-pill ${record.status.toLowerCase()}`}>{record.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        );
    };

    // 5. ENROLL & MY COURSES (Basic Logic)
    const renderEnrollCourse = () => {
        const availableCourses = allCourses.filter(course =>
            !enrolledCourses.some(enrolled => enrolled.course_id === course.id) &&
            course.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="management-page">
                <div className="management-header"><h2>Enroll in a New Course</h2></div>
                <div className="search-box-wide"><Search size={18} /><input type="text" placeholder="Search courses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="cards-list">
                    {availableCourses.length > 0 ? availableCourses.map(course => (
                        <div className="content-card" key={course.id}>
                            <div className="card-header-row">
                                <h3>{course.title}</h3>
                                <button className="btn-primary" onClick={() => handleEnroll(course.id)} disabled={course.available_seats <= 0}>
                                    {course.available_seats > 0 ? 'Enroll Now' : 'Full'}
                                </button>
                            </div>
                            <p>{course.description}</p>
                            <div className="meta-info-row">
                                <span><User size={14} /> {course.trainer_name}</span>

                                <span><Award size={14} /> Price: ${course.course_fee}</span>

                                <span><Users size={14} /> Seats: {course.available_seats}</span>
                            </div>
                        </div>
                    )) : <div className="empty-state"><p>No courses found.</p></div>}
                </div>



            </div>
        );
    };

    const renderEnrolledCourses = () => (
        <div className="management-page">
            <div className="management-header"><h2>My Courses</h2></div>
            <div className="cards-list">
                {enrolledCourses.length > 0 ? enrolledCourses.map(enrollment => (
                    <div className="content-card" key={enrollment.id}>
                        <h3>{enrollment.course_title}</h3>
                        <p>{enrollment.course_description}</p>
                        <div className="meta-info-row"><span><Calendar size={14} /> Enrolled: {formatDate(enrollment.enrolled_on)}</span></div>
                    </div>
                )) : <div className="empty-state"><p>You are not enrolled in any courses.</p></div>}
            </div>
        </div>
    );




    // 6. AI Tutor 

    const renderAITutor = () => (
        <div className="management-page">

            <div className="management-header">
                <h2>AI Course Tutor</h2>
                <p>Ask questions by typing or using voice. Get answers in text + speech.</p>
            </div>

            {/* LANGUAGE + SPEED CONTROL */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>

                {/* Language Selector */}
                <div>
                    <label style={{ fontWeight: "bold" }}>Language</label>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{ padding: "6px", borderRadius: "6px", marginLeft: "10px" }}
                    >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="hi-IN">Hindi</option>
                        <option value="ta-IN">Tamil</option>
                        <option value="te-IN">Telugu</option>
                    </select>
                </div>

                {/* Voice Speed */}
                <div>
                    <label style={{ fontWeight: "bold" }}>Voice Speed: {voiceSpeed}x</label>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={voiceSpeed}
                        onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                        style={{ marginLeft: "10px" }}
                    />
                </div>

                {/* Voice Mode Toggle */}
                <div>
                    <label style={{ marginLeft: "10px" }}>
                        <input
                            type="checkbox"
                            checked={isVoiceMode}
                            onChange={(e) => setIsVoiceMode(e.target.checked)}
                        /> Enable Voice Mode
                    </label>
                </div>
            </div>


            {/* INPUT BOX */}
            <div className="content-card ai-input-card" style={{ borderLeft: "4px solid #4f46e5" }}>
                <h3><MessageCircle size={18} /> Ask a New Question</h3>

                <textarea
                    className="ai-textarea"
                    placeholder="Ask anything…"
                    value={newQueryText}
                    onChange={(e) => setNewQueryText(e.target.value)}
                    rows={3}
                />

                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>

                    {/* MICROPHONE BUTTON */}
                    {speechSupported && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className="btn-secondary"
                            style={{
                                animation: isListening ? "pulse 1s infinite" : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            {isListening ? "Listening..." : "Voice"}
                        </button>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        className="btn-primary"
                        disabled={!newQueryText.trim()}
                        onClick={handleSubmitQuery}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        {isAIGenerating ? <Loader className="spin" /> : <Send size={16} />}
                        Ask AI
                    </button>
                </div>
            </div>


            {/* HISTORY */}
            <div className="history-section" style={{
                margin: "30px 0",
                maxHeight: "500px",        // Set max height for scrolling
                overflowY: "auto",
                paddingRight: "10px"       // Avoid scrollbar overlap
            }}>
                <div className="section-header" style={{ marginBottom: "15px", fontWeight: 600, fontSize: "1.5rem" }}>
                    HISTORY ({aiHistory.length})
                </div>

                {aiHistory.map(chat => (
                    <div key={chat.id} className="content-card" style={{
                        padding: "15px 20px",
                        marginBottom: "12px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        backgroundColor: "#fff",
                        transition: "transform 0.1s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <div className="card-header-row" style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "8px"
                        }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>{chat.query}</h3>

                            <button
                                className="btn-primary"
                                style={{ padding: "6px 12px", fontSize: "0.9rem" }}
                                onClick={() => setSelectedChat(chat)}
                            >
                                View Answer
                            </button>
                        </div>

                        <p style={{ fontSize: "0.95rem", lineHeight: "1.4", color: "#333" }}>
                            {chat.response.length > 120 ? chat.response.substring(0, 120) + "..." : chat.response}
                        </p>

                        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                            <button className="btn-secondary" onClick={() => speak(chat.response)}>
                                <Volume2 size={16} /> Speak
                            </button>

                            {isSpeaking && (
                                <button className="btn-secondary red" onClick={stopSpeaking}>
                                    <VolumeX size={16} /> Stop
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* FULL ANSWER MODAL */}
            {selectedChat && (
                <div className="modal-overlay" style={{
                    position: "fixed",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: "#fff",
                        padding: "25px 30px",
                        borderRadius: "12px",
                        maxWidth: "600px",
                        width: "90%",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}>
                        <h3 style={{ marginTop: 0 }}>{selectedChat.query}</h3>
                        <p style={{ fontSize: "1rem", lineHeight: "1.5", color: "#333" }}>{selectedChat.response}</p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                            <button className="btn-secondary" onClick={() => speak(selectedChat.response)}>
                                <Volume2 size={16} /> Speak
                            </button>

                            <button className="btn-primary" onClick={() => setSelectedChat(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


    // --- MAIN RENDER ---
    const renderMainContent = () => {
        if (loading) return <div className="loading-state"><Loader size={48} /><p>Loading Student Portal...</p></div>;
        if (error && !isCourseDataLoading) return <div className="error-state"><AlertTriangle size={48} /><p>{error}</p></div>;

        let content;
        switch (activeTab) {
            case 'dashboard': return renderDashboard(); break;
            case 'enroll': return renderEnrollCourse(); break
            case 'my-courses': return renderEnrolledCourses(); break;
            case 'assignments': return renderAssignments(); break;
            case 'grades': return renderGrades(); break;
            case 'attendance': return renderAttendance(); break;
            case 'aitutor': return renderAITutor(); break;
            case 'videos': return renderVideosTab();
            default: content = null;
        }
    };

    return (
        <div key={activeTab} className='animate-center'>
            <div className="student-dashboard-layout">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <div className="logo">
                            <Book size={24} strokeWidth={2.5} />
                        </div>
                        <div className="brand-text">
                            <h2>Learning Management</h2>
                            <span>System</span>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <p className="nav-title">MENU</p>
                        <a href="#dashboard" className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                            <Home size={20} /><span>Dashboard</span>
                        </a>
                        <a href="#my-courses" className={activeTab === 'my-courses' ? 'active' : ''} onClick={() => setActiveTab('my-courses')}>
                            <BookOpen size={20} /><span>My Courses</span>
                        </a>
                        <a href="#enroll" className={activeTab === 'enroll' ? 'active' : ''} onClick={() => setActiveTab('enroll')}>
                            <Plus size={20} /><span>Enroll</span>
                        </a>

                        <p className="nav-title">ACADEMICS</p>
                        <a href="#assignments" className={activeTab === 'assignments' ? 'active' : ''} onClick={() => setActiveTab('assignments')}>
                            <CheckSquare size={20} /><span>Assignments</span>
                        </a>
                        <a href="#grades" className={activeTab === 'grades' ? 'active' : ''} onClick={() => setActiveTab('grades')}>
                            <Award size={20} /><span>Grades</span>
                        </a>
                        <a href="#attendance" className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
                            <Clipboard size={20} /><span>Attendance</span>
                        </a>
                        <a href="#videos" className={activeTab === 'videos' ? 'active' : ''} onClick={() => setActiveTab('videos')}>
                            <BookOpen size={20} /><span>Course Videos</span>
                        </a>
                        <a href="#aitutor" className={activeTab === 'aitutor' ? 'active' : ''} onClick={() => setActiveTab('aitutor')}>
                            <Cpu size={20} /> <span>AI Tutor</span>
                        </a>

                    </nav>

                    {/* --- UPDATED FOOTER SECTION --- */}
                    <div className="sidebar-footer">
                        {student && (
                            <div className="user-profile-widget">
                                <div className="avatar small">{getInitials(student.name)}</div>
                                <span>{student.name}</span>
                            </div>
                        )}
                        <a
                            href="#logout"
                            className="logout-link"
                            onClick={(e) => {
                                e.preventDefault();
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </a>
                    </div>
                </aside>


                <main className="student-main">
                    <header className="main-header">
                        <div className="header-welcome-section">
                            <div className="header-title">
                                <h1>Good Morning, {student ? student.name.split(' ')[0] : 'Student'}! 👋</h1>
                            </div>
                            <div className="header-date">
                                <Calendar size={14} />
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        {student && (
                            <div className="header-profile-group">
                                <div style={{ textAlign: 'right', marginRight: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>{student.name}</span>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af' }}>Student Account</span>
                                </div>
                                <div className="avatar medium">{getInitials(student.name)}</div>
                            </div>
                        )}
                    </header>
                    <div className="content-area">
                        {renderMainContent()}
                    </div>
                </main>




                {/* SUBMIT ASSIGNMENT MODAL */}
                {isSubmitModalOpen && currentAssignment && (
                    <div className="modal-backdrop">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>Submit Assignment</h2>
                                <button onClick={() => setIsSubmitModalOpen(false)}><X size={24} /></button>
                            </div>
                            <form className="modal-form" onSubmit={handleSubmitAssignment}>
                                <h3 className="modal-subtitle">{currentAssignment.title}</h3>
                                <p className="modal-desc">Max Score: {currentAssignment.max_score} • Due: {formatDate(currentAssignment.due_date)}</p>

                                <label>File URL (Cloud Link)</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://drive.google.com/..."
                                    value={submissionForm.file_url}
                                    onChange={e => setSubmissionForm({ ...submissionForm, file_url: e.target.value })}
                                />

                                <label>Comments (Optional)</label>
                                <textarea
                                    placeholder="Any notes for the trainer..."
                                    value={submissionForm.comments}
                                    onChange={e => setSubmissionForm({ ...submissionForm, comments: e.target.value })}
                                />

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setIsSubmitModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="submit-btn">Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {renderPaymentModal()}
            </div>
        </div>
    );
}



export default StudentDashboard;