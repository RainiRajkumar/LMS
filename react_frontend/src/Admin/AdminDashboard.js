// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {Users,Book,FileText,AlertCircle,Plus,Edit,Trash2,UserCheck,Clipboard,Home,LogOut,ChevronRight,Search,Bell} from "react-feather";
// import "./AdminDashboard.css";
// function AdminDashboard() {
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [students, setStudents] = useState([]);
//   const [trainers, setTrainers] = useState([]);
//   const [courses, setCourses] = useState([]);
//   const [enrollments, setEnrollments] = useState([]);
//   const [assignments, setAssignments] = useState([]);
//   const [formData, setFormData] = useState({});
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalType, setModalType] = useState("");
//   const token = localStorage.getItem("token");
//   const [payments, setPayments] = useState([]);
//   useEffect(() => {
//     fetchStudents();
//     fetchTrainers();
//     fetchCourses();
//     fetchAssignments();
//     fetchEnrollments();
//     fetchPayments();
//   }, []);
//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/students/", { headers: { Authorization: `Bearer ${token}` } });
//       setStudents(res.data);
//     } catch (err) { console.error(err); }
//   };
//   const fetchTrainers = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/trainers", { headers: { Authorization: `Bearer ${token}` } });
//       setTrainers(res.data);
//     } catch (err) { console.error(err); }
//   };

//   const fetchCourses = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/admin/courses", { headers: { Authorization: `Bearer ${token}` } });
//       setCourses(res.data);
//     } catch (err) { console.error(err); }
//   };

//   const fetchEnrollments = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/admin/enrollments", { headers: { Authorization: `Bearer ${token}` } });
//       setEnrollments(res.data);
//     } catch (err) { console.error(err); }
//   };

//   const fetchAssignments = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/admin/assignments", { headers: { Authorization: `Bearer ${token}` } });
//       setAssignments(res.data);
//       console.log(res.data)
//     } catch (err) { console.error(err); }
//   };

//   const fetchPayments = async () => {
//     try {
//       const res = await axios.get(
//         "http://localhost:8000/payment/admin/all",
//         {
//           headers: { Authorization: `Bearer ${token}` }
//         }
//       );
//       setPayments(res.data);
//     } catch (err) {
//       console.error("Error loading payments:", err);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     let url = "";
//     let method = "post";
//     let data = { ...formData };

//     if (modalType === "student" && data.id && !data.password) delete data.password;

//     let fetcher = () => { };

//     switch (modalType) {
//       case "student":
//         url = formData.id ? `http://localhost:8000/students/${formData.id}` : "http://localhost:8000/students/";
//         method = formData.id ? "put" : "post";
//         fetcher = fetchStudents;
//         break;
//       case "trainer":
//         url = formData.id ? `http://localhost:8000/trainers/${formData.id}` : "http://localhost:8000/trainers";
//         method = formData.id ? "put" : "post";
//         fetcher = fetchTrainers;
//         break;
//       case "course":
//         url = formData.id ? `http://localhost:8000/admin/courses/${formData.id}` : "http://localhost:8000/admin/courses";
//         method = formData.id ? "put" : "post";
//         fetcher = fetchCourses;
//         break;
//       default: return;
//     }

//     try {
//       await axios({ method, url, data, headers: { Authorization: `Bearer ${token}` } });
//       fetcher();
//       setFormData({});
//       setIsModalOpen(false);
//     } catch (err) {
//       alert("Error: " + (err.response?.data?.detail || err.message));
//     }
//   };

//   const handleEdit = (item, type) => {
//     const itemCopy = { ...item };
//     if (type === "student") itemCopy.password = "";
//     if (type === "trainer" && !itemCopy.course_ids) {
//       itemCopy.course_ids = [];
//     }
//     setFormData(itemCopy);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id, type) => {
//     if (!window.confirm("Are you sure?")) return;
//     try {
//       let url = "";
//       let fetcher = () => { };
//       if (type === "student") { url = `http://localhost:8000/students/${id}`; fetcher = fetchStudents; }
//       else if (type === "trainer") { url = `http://localhost:8000/admin/trainers/${id}`; fetcher = fetchTrainers; }
//       else if (type === "course") { url = `http://localhost:8000/admin/courses/${id}`; fetcher = fetchCourses; }

//       await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
//       fetcher();
//     } catch (err) { alert("Delete failed"); }
//   };

//   const openModal = (type) => {
//     setModalType(type);
//     setFormData(type === "trainer" ? { course_ids: [] } : {});
//     setIsModalOpen(true);
//   };


//   // Helper to toggle course IDs in the formData
//   const toggleCourseSelection = (courseId) => {
//     // Ensure course_ids exists as an array
//     const currentSelected = formData.course_ids || [];

//     if (currentSelected.includes(courseId)) {
//       // If already selected, remove it
//       setFormData({
//         ...formData,
//         course_ids: currentSelected.filter((id) => id !== courseId),
//       });
//     } else {
//       // If not selected, add it
//       setFormData({
//         ...formData,
//         course_ids: [...currentSelected, courseId],
//       });
//     }
//   };
//   const renderForm = () => {
//     // Form rendering logic remains the same as your code...
//     if (modalType === "student") {
//       return (
//         <>
//           <input type="text" placeholder="Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
//           <input type="number" placeholder="Age" value={formData.age || ""} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} required />
//           <input type="text" placeholder="Course" value={formData.course || ""} onChange={(e) => setFormData({ ...formData, course: e.target.value })} required />
//           <input type="text" placeholder="Username" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
//           <input type="password" placeholder={formData.id ? "New Password (optional)" : "Password"} value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!formData.id} />
//           <input type="email" placeholder="Email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
//         </>
//       );
//     }
//     if (modalType === "trainer") {
//       return (
//         <>
//           <input type="text" placeholder="Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
//           <input type="number" placeholder="Age" value={formData.age || ""} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} required />
//           <input type="text" placeholder="Username" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
//           <input type="password" placeholder="Password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!formData.id} />
//           <input type="email" placeholder="Email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />

//           {/* COURSE SELECTION SECTION */}
//           <div className="form-section-label" style={{ marginTop: '15px', marginBottom: '5px', fontWeight: 'bold' }}>
//             Assign Courses:
//           </div>
//           <div className="course-checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
//             {courses.length > 0 ? (
//               courses.map((course) => {
//                 // 1. Find if any trainer (other than the one we are editing) has this course
//                 const assignedTrainer = trainers.find((t) =>
//                   // Ensure course_ids exists and includes the current course ID
//                   Array.isArray(t.course_ids) && t.course_ids.includes(course.id)
//                 );

//                 // 2. Check if it is taken by SOMEONE ELSE (not the current formData.id)
//                 const isTakenByOther = assignedTrainer && assignedTrainer.id !== formData.id;

//                 // 3. Define styling for disabled items
//                 const itemStyle = {
//                   display: "flex",
//                   alignItems: "center",
//                   marginBottom: "8px",
//                   opacity: isTakenByOther ? 0.5 : 1 // Fade out if taken
//                 };

//                 return (
//                   <div key={course.id} style={itemStyle}>
//                     <input
//                       type="checkbox"
//                       id={`course-${course.id}`}
//                       // If taken by another, disable the input
//                       disabled={isTakenByOther}
//                       checked={(formData.course_ids || []).includes(course.id)}
//                       onChange={() => toggleCourseSelection(course.id)}
//                       style={{ width: "auto", marginRight: "10px" }}
//                     />
//                     <label
//                       htmlFor={`course-${course.id}`}
//                       style={{ margin: 0, cursor: isTakenByOther ? "not-allowed" : "pointer" }}
//                     >
//                       {course.title}
//                       {/* Show who has the course if it is taken */}
//                       {isTakenByOther && (
//                         <span style={{ color: "red", fontSize: "0.8em", marginLeft: "10px" }}>
//                           (Assigned to {assignedTrainer.name})
//                         </span>
//                       )}
//                     </label>
//                   </div>
//                 );
//               })
//             ) : (
//               <p style={{ fontSize: "0.9em", color: "#666" }}>No courses available.</p>
//             )}
//           </div>
//         </>
//       );
//     }
//     if (modalType === "course") {
//       return (
//         <>
//           <input type="text" placeholder="Title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
//           <textarea placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
//           <input type="number" placeholder="Course Fee" value={formData.course_fee || ""} onChange={(e) => setFormData({ ...formData, course_fee: Number(e.target.value) })} required />
//           <input type="number" placeholder="Seats" value={formData.seats || ""} onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })} required />
//         </>
//       );
//     }
//   };

//   const renderTable = (type) => {
//     let data = [];
//     if (type === "students") data = students;
//     if (type === "trainers") data = trainers;
//     if (type === "courses") data = courses;
//     if (type === "enrollments") data = enrollments;
//     if (type === "assignments") data = assignments;
//     if (type === "payments") data = payments;

//     if (!data.length) return <div className="empty-table">No records found.</div>;
//     const showActions = type === 'students' || type === 'trainers' || type === 'courses';

//     return (
//       <div className="table-container fade-in">
//         <table className="admin-table">
//           <thead>
//             <tr>
//               {Object.keys(data[0]).filter((key) => key !== "password").map((key) => (
//                 <th key={key}>{key.replace(/_/g, " ")}</th>
//               ))}
//               {showActions && <th>Actions</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((item) => (
//               <tr key={item.id}>
//                 {Object.entries(item).filter(([k]) => k !== "password").map(([_, val], i) => (
//                   <td key={i}>{Array.isArray(val) ? val.join(", ") : String(val)}</td>
//                 ))}
//                 {showActions && (
//                   <td>
//                     <button className="action-btn edit" onClick={() => handleEdit(item, type.slice(0, -1))}><Edit size={14} /></button>
//                     <button className="action-btn delete" onClick={() => handleDelete(item.id, type.slice(0, -1))}><Trash2 size={14} /></button>
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     );
//   };

//   const renderContent = () => {
//     if (activeTab === "dashboard") {
//       return (
//         <div className="dashboard-view fade-in">
//           {/* Top Cards Row */}
//           <div className="stats-grid">
//             {/* Card 1: Blue - Students */}
//             <div className="stat-card blue-gradient">
//               <div className="stat-content">
//                 <span>Active Students</span>
//                 <h3>{students.length}</h3>
//               </div>
//               <div className="stat-icon">
//                 <Users size={24} />
//               </div>
//             </div>

//             {/* Card 2: Purple - Courses */}
//             <div className="stat-card purple-gradient">
//               <div className="stat-content">
//                 <span>Active Courses</span>
//                 <h3>{courses.length}</h3>
//               </div>
//               <div className="stat-icon">
//                 <Book size={24} />
//               </div>
//             </div>

//             {/* Card 3: Green - Assignments */}
//             <div className="stat-card green-gradient">
//               <div className="stat-content">
//                 <span>Assignments</span>
//                 <h3>{assignments.length || 0}</h3>
//               </div>
//               <div className="stat-icon">
//                 <FileText size={24} />
//               </div>
//             </div>

//             {/* Card 4: Orange - Pending/Trainers */}
//             <div className="stat-card orange-gradient">
//               <div className="stat-content">
//                 <span>Active Trainers</span>
//                 <h3>{trainers.length}</h3>
//               </div>
//               <div className="stat-icon">
//                 <AlertCircle size={24} />
//               </div>
//             </div>
//           </div>

//           {/* Bottom Split Section */}
//           <div className="dashboard-bottom-grid">

//             {/* Left: Upcoming Assignments */}
//             <div className="section-card assignments-section">
//               <div className="card-header">
//                 <h4>Upcoming Assignments</h4>
//                 <a href="#viewall" className="view-all-link">View All <ChevronRight size={14} /></a>
//               </div>

//               <div className="assignments-list">
//                 {assignments.length === 0 ? (
//                   <div className="empty-state">
//                     <FileText size={40} />
//                     <p>No upcoming assignments.</p>
//                   </div>
//                 ) : (
//                   assignments.slice(0, 3).map((a, index) => (
//                     <div key={index} className="assignment-item">
//                       <div className="assign-icon-box">
//                         <FileText size={20} />
//                       </div>
//                       <div className="assign-details">
//                         <h5>{a.title}</h5>
//                         <span className="assign-course">{a.description}</span>
//                       </div>
//                       <div className="assign-meta">
//                         <span className="points">{a.max_score} score</span>
//                         <span className="due-date">Due: {a.due_date || "Dec 09"}</span>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Right: Quick Actions */}
//             <div className="section-card quick-actions-section">
//               <div className="card-header">
//                 <h4>Quick Actions</h4>
//               </div>
//               <div className="actions-grid">
//                 <button className="action-tile" onClick={() => openModal("student")}>
//                   <div className="tile-icon blue"><Users size={20} /></div>
//                   <span>Add Student</span>
//                 </button>
//                 <button className="action-tile" onClick={() => openModal("course")}>
//                   <div className="tile-icon purple"><Book size={20} /></div>
//                   <span>Add Course</span>
//                 </button>
//                 <button className="action-tile" onClick={() => openModal("trainer")}>
//                   <div className="tile-icon orange"><UserCheck size={20} /></div>
//                   <span>Add Trainer</span>
//                 </button>
//                 <button className="action-tile" onClick={() => setActiveTab("enrollments")}>
//                   <div className="tile-icon green"><Clipboard size={20} /></div>
//                   <span>Enrollments</span>
//                 </button>


//               </div>
//             </div>

//           </div>
//         </div>
//       );
//     }



//     // Other Tabs
//     return (
//       <div className="generic-tab-view fade-in">
//         <div className="table-header-row">
//           <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>

//           {/* Hide Add Button for enrollments AND payments */}
//           {activeTab !== "enrollments" && activeTab !== "payments" && activeTab !== "assignments" && (
//             <button
//               className="add-record-btn"
//               onClick={() => openModal(activeTab.slice(0, -1))}
//             >
//               <Plus size={16} /> Add New
//             </button>
//           )}
//         </div>

//         {renderTable(activeTab)}
//       </div>

//     );
//   };

//   return (
//     <div className="admin-dashboard-layout">
//       <aside className="sidebar">
//         <div className="sidebar-brand">
//           <div className="brand-logo">
//             <Book size={24} strokeWidth={2.5} />
//           </div>
//           <div className="brand-text">
//             <h2>Learning Management</h2>
//             <span>System</span>
//           </div>
//         </div>

//         <nav className="sidebar-menu">
//           <p className="menu-label">Main Menu</p>
//           <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
//             <Home size={20} /> Dashboard
//           </button>
//           <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>
//             <Users size={20} /> Students
//           </button>
//           <button className={activeTab === "trainers" ? "active" : ""} onClick={() => setActiveTab("trainers")}>
//             <UserCheck size={20} /> Trainers
//           </button>
//           <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}>
//             <Book size={20} /> Courses
//           </button>
//           <button className={activeTab === "assignments" ? "active" : ""} onClick={() => setActiveTab("assignments")}>
//             <FileText size={20} /> Assignments
//           </button>
//           <button className={activeTab === "enrollments" ? "active" : ""} onClick={() => setActiveTab("enrollments")}>
//             <Clipboard size={20} /> Enrollments
//           </button>
//           <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>
//             <Clipboard size={20} /> Payments
//           </button>
//         </nav>


//         <div className="sidebar-footer">
//           <div className="user-profile-widget">
//             <div className="avatar small">(A)</div>
//             <span>Admin</span>
//           </div>
//           <button
//             className="logout-btn"
//             onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
//           >
//             <LogOut size={18} />
//             <span>Sign Out</span>
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className="main-content">
//         <header className="top-bar">
//           <div className="greeting">
//             <h1>Admin Dashboard</h1>
//             <p>Welcome back, Administrator</p>
//           </div>
//           <div className="top-actions">
//             <div className="search-box">
//               <Search size={16} />
//               <input type="text" placeholder="Search..." />
//             </div>
//             <button className="icon-btn-header"><Bell size={18} /></button>
//             <button className="primary-btn" onClick={() => openModal("student")}>
//               <Plus size={16} /> Add Student
//             </button>
//           </div>
//         </header>

//         <div className="content-wrapper">
//           {renderContent()}
//         </div>
//       </main>

//       {/* Modal */}
//       {isModalOpen && (
//         <div className="modal-overlay fadeIn">
//           <div className="modal-content slideIn">
//             <div className="modal-header">
//               <h2>{formData.id ? "Edit" : "Add"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
//               <button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
//             </div>
//             <form onSubmit={handleSubmit}>
//               <div className="modal-body">
//                 {renderForm()}
//               </div>
//               <div className="modal-footer">
//                 <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
//                 <button type="submit" className="btn-submit">{formData.id ? "Update" : "Add"}</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default AdminDashboard;

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Users, Book, FileText, AlertCircle, Plus, Edit, Trash2,
  UserCheck, Clipboard, Home, LogOut, ChevronRight, Search,
  Bell, MessageCircle, X, Send // Added MessageCircle, X, Send
} from "react-feather";
import {
  LineChart, Line, BarChart, Bar,LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import "./AdminDashboard.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payments, setPayments] = useState([]);

  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  const [courseCompletion, setCourseCompletion] = useState([]);
const [performanceTrend, setPerformanceTrend] = useState([]);
const [assignmentDifficulty, setAssignmentDifficulty] = useState([]);
const [revenueData, setRevenueData] = useState([]);


  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };


  // --- RAG / AI CHAT STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "bot", content: "Hello! I am your LMS Assistant. Ask me anything about students, courses, or payments." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStudents();
    fetchTrainers();
    fetchCourses();
    fetchAssignments();
    fetchEnrollments();
    fetchPayments();
    fetchAuditLogs();
    fetchAuditStats();
    fetchAnalytics();
  }, []);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatOpen]);

  // ... [Existing fetch functions: fetchStudents, fetchTrainers, etc.] ...
  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:8000/students/", { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchTrainers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/trainers", { headers: { Authorization: `Bearer ${token}` } });
      setTrainers(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/courses", { headers: { Authorization: `Bearer ${token}` } });
      setCourses(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchEnrollments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/enrollments", { headers: { Authorization: `Bearer ${token}` } });
      setEnrollments(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchAssignments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/admin/assignments", { headers: { Authorization: `Bearer ${token}` } });
      setAssignments(res.data);
    } catch (err) { console.error(err); }
  };
  const fetchPayments = async () => {
    try {
      const res = await axios.get("http://localhost:8000/payment/admin/all", { headers: { Authorization: `Bearer ${token}` } });
      setPayments(res.data);
    } catch (err) { console.error("Error loading payments:", err); }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/auditlogs", { headers: { Authorization: `Bearer ${token}` } });
      setAuditLogs(res.data.data);   // ✅ ARRAY

    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };
  const fetchAuditStats = async () => {
    const res = await axios.get("http://localhost:8000/auditlogs/stats", { headers: { Authorization: `Bearer ${token}` } });
    setAuditStats(res.data);
  };

 const fetchAnalytics = async () => {
  try {
    const headers = { Authorization: `Bearer ${token}` };

    const [
      completionRes,
      performanceRes,
      difficultyRes,
      revenueRes
    ] = await Promise.all([
      axios.get("http://localhost:8000/admin/analytics/course-completion", { headers }),
      axios.get("http://localhost:8000/admin/analytics/performance-trend", { headers }),
      axios.get("http://localhost:8000/admin/analytics/assignment-difficulty", { headers }),
      axios.get("http://localhost:8000/admin/analytics/revenue", { headers }) // ✅ FIXED
    ]);

    setCourseCompletion(completionRes.data);
    setPerformanceTrend(performanceRes.data);
    setAssignmentDifficulty(difficultyRes.data);

    // ✅ FORMAT REVENUE DATA FOR CHART
    const formattedRevenue = revenueRes.data.map(item => ({
      date: `${item.month}/${item.year}`,
      total: item.revenue
    }));

    setRevenueData(formattedRevenue);

    console.log("Revenue Chart Data:", formattedRevenue);

  } catch (err) {
    console.error("Analytics loading failed", err);
  }
};



  // ... [Existing Handlers: handleSubmit, handleEdit, handleDelete, openModal, toggleCourseSelection] ...
  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = "";
    let method = "post";
    let data = { ...formData };
    if (modalType === "student" && data.id && !data.password) delete data.password;
    let fetcher = () => { };

    switch (modalType) {
      case "student":
        url = formData.id ? `http://localhost:8000/students/${formData.id}` : "http://localhost:8000/students/";
        method = formData.id ? "put" : "post";
        fetcher = fetchStudents;
        break;
      case "trainer":
        url = formData.id ? `http://localhost:8000/trainers/${formData.id}` : "http://localhost:8000/trainers";
        method = formData.id ? "put" : "post";
        fetcher = fetchTrainers;
        break;
      case "course":
        url = formData.id ? `http://localhost:8000/admin/courses/${formData.id}` : "http://localhost:8000/admin/courses";
        method = formData.id ? "put" : "post";
        fetcher = fetchCourses;
        break;
      default: return;
    }

    try {
      await axios({ method, url, data, headers: { Authorization: `Bearer ${token}` } });
      fetcher();
      setFormData({});
      setIsModalOpen(false);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (item, type) => {
    const itemCopy = { ...item };
    if (type === "student") itemCopy.password = "";
    if (type === "trainer" && !itemCopy.course_ids) itemCopy.course_ids = [];
    setFormData(itemCopy);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      let url = "";
      let fetcher = () => { };
      if (type === "student") { url = `http://localhost:8000/students/${id}`; fetcher = fetchStudents; }
      else if (type === "trainer") { url = `http://localhost:8000/admin/trainers/${id}`; fetcher = fetchTrainers; }
      else if (type === "course") { url = `http://localhost:8000/admin/courses/${id}`; fetcher = fetchCourses; }
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      fetcher();
    } catch (err) { alert("Delete failed"); }
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData(type === "trainer" ? { course_ids: [] } : {});
    setIsModalOpen(true);
  };

  const toggleCourseSelection = (courseId) => {
    const currentSelected = formData.course_ids || [];
    if (currentSelected.includes(courseId)) {
      setFormData({ ...formData, course_ids: currentSelected.filter((id) => id !== courseId) });
    } else {
      setFormData({ ...formData, course_ids: [...currentSelected, courseId] });
    }
  };

  // --- NEW RAG CHAT HANDLER ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMessage = { role: "user", content: chatQuery };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatQuery("");
    setIsChatLoading(true);

    try {
      // NOTE: This assumes you have created a /rag/query endpoint in your FastAPI backend
      const res = await axios.post(
        "http://localhost:8000/query",
        { query: chatQuery },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage = {
        role: "bot",
        content: res.data.answer || "I found some info but couldn't generate an answer."
      };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "bot", content: "Sorry, I encountered an error connecting to the AI." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ... [Existing Render Functions: renderForm, renderTable] ...
  const renderForm = () => {
    if (modalType === "student") {
      return (
        <>
          <input type="text" placeholder="Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input type="number" placeholder="Age" value={formData.age || ""} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} required />
          <input type="text" placeholder="Course" value={formData.course || ""} onChange={(e) => setFormData({ ...formData, course: e.target.value })} required />
          <input type="text" placeholder="Username" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
          <input type="password" placeholder={formData.id ? "New Password (optional)" : "Password"} value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!formData.id} />
          <input type="email" placeholder="Email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        </>
      );
    }
    if (modalType === "trainer") {
      return (
        <>
          <input type="text" placeholder="Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input type="number" placeholder="Age" value={formData.age || ""} onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })} required />
          <input type="text" placeholder="Username" value={formData.username || ""} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
          <input type="password" placeholder="Password" value={formData.password || ""} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!formData.id} />
          <input type="email" placeholder="Email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <div className="form-section-label" style={{ marginTop: '15px', marginBottom: '5px', fontWeight: 'bold' }}>Assign Courses:</div>
          <div className="course-checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '5px' }}>
            {courses.length > 0 ? (
              courses.map((course) => {
                const assignedTrainer = trainers.find((t) => Array.isArray(t.course_ids) && t.course_ids.includes(course.id));
                const isTakenByOther = assignedTrainer && assignedTrainer.id !== formData.id;
                return (
                  <div key={course.id} style={{ display: "flex", alignItems: "center", marginBottom: "8px", opacity: isTakenByOther ? 0.5 : 1 }}>
                    <input type="checkbox" id={`course-${course.id}`} disabled={isTakenByOther} checked={(formData.course_ids || []).includes(course.id)} onChange={() => toggleCourseSelection(course.id)} style={{ width: "auto", marginRight: "10px" }} />
                    <label htmlFor={`course-${course.id}`} style={{ margin: 0, cursor: isTakenByOther ? "not-allowed" : "pointer" }}>{course.title}{isTakenByOther && <span style={{ color: "red", fontSize: "0.8em", marginLeft: "10px" }}>(Assigned to {assignedTrainer.name})</span>}</label>
                  </div>
                );
              })
            ) : (<p style={{ fontSize: "0.9em", color: "#666" }}>No courses available.</p>)}
          </div>
        </>
      );
    }
    if (modalType === "course") {
      return (
        <>
          <input type="text" placeholder="Title" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          <textarea placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          <input type="number" placeholder="Course Fee" value={formData.course_fee || ""} onChange={(e) => setFormData({ ...formData, course_fee: Number(e.target.value) })} required />
          <input type="number" placeholder="Seats" value={formData.seats || ""} onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) })} required />
        </>
      );
    }
  };

  const renderTable = (type) => {
    let data = [];
    if (type === "students") data = students;
    if (type === "trainers") data = trainers;
    if (type === "courses") data = courses;
    if (type === "enrollments") data = enrollments;
    if (type === "assignments") data = assignments;
    if (type === "payments") data = payments;
    if (type === "audit") data = auditLogs;

    if (!data.length) return <div className="empty-table">No records found.</div>;
    const showActions = type === 'students' || type === 'trainers' || type === 'courses';

    return (
      <div className="table-container fade-in">
        <table className="admin-table">
          <thead>
            <tr>
              {Object.keys(data[0]).filter((key) => key !== "password").map((key) => (<th key={key}>{key.replace(/_/g, " ")}</th>))}
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                {Object.entries(item).filter(([k]) => k !== "password").map(([_, val], i) => (
                  <td key={i}>{Array.isArray(val) ? val.join(", ") : String(val)}</td>
                ))}
                {showActions && (
                  <td>
                    <button className="action-btn edit" onClick={() => handleEdit(item, type.slice(0, -1))}><Edit size={14} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(item.id, type.slice(0, -1))}><Trash2 size={14} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === "dashboard") { 
      return (
        <div className="dashboard-view fade-in">
          <div className="stats-grid">
            <div className="stat-card blue-gradient">
              <div className="stat-content"><span>Active Students</span><h3>{students.length}</h3></div>
              <div className="stat-icon"><Users size={24} /></div>
            </div>
            <div className="stat-card pu rple-gradient">
              <div className="stat-content"><span>Active Courses</span><h3>{courses.length}</h3></div>
              <div className="stat-icon"><Book size={24} /></div>
            </div>
            <div className="stat-card green-gradient">
              <div className="stat-content"><span>Assignments</span><h3>{assignments.length || 0}</h3></div>
              <div className="stat-icon"><FileText size={24} /></div>
            </div>
            <div className="stat-card orange-gradient">
              <div className="stat-content"><span>Active Trainers</span><h3>{trainers.length}</h3></div>
              <div className="stat-icon"><AlertCircle size={24} /></div>
            </div>
          </div>

          <div className="dashboard-bottom-grid">
            <div className="section-card assignments-section">
              <div className="card-header"><h4>Upcoming Assignments</h4><a href="#viewall" className="view-all-link">View All <ChevronRight size={14} /></a></div>
              <div className="assignments-list">
                {assignments.length === 0 ? (
                  <div className="empty-state"><FileText size={40} /><p>No upcoming assignments.</p></div>
                ) : (
                  assignments.slice(0, 3).map((a, index) => (
                    <div key={index} className="assignment-item">
                      <div className="assign-icon-box"><FileText size={20} /></div>
                      <div className="assign-details"><h5>{a.title}</h5><span className="assign-course">{a.description}</span></div>
                      <div className="assign-meta"><span className="points">{a.max_score} score</span><span className="due-date">Due: {a.due_date || "Dec 09"}</span></div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="section-card quick-actions-section">
              <div className="card-header"><h4>Quick Actions</h4></div>
              <div className="actions-grid">
                <button className="action-tile" onClick={() => openModal("student")}><div className="tile-icon blue"><Users size={20} /></div><span>Add Student</span></button>
                <button className="action-tile" onClick={() => openModal("course")}><div className="tile-icon purple"><Book size={20} /></div><span>Add Course</span></button>
                <button className="action-tile" onClick={() => openModal("trainer")}><div className="tile-icon orange"><UserCheck size={20} /></div><span>Add Trainer</span></button>
                <button className="action-tile" onClick={() => setActiveTab("enrollments")}><div className="tile-icon green"><Clipboard size={20} /></div><span>Enrollments</span></button>
              </div>
            </div>
          </div>



        <div className="analytics-grid">

  {/* 💰 Revenue */}
  <div className="section-card">
    <h4>Payment Revenue</h4>
    
    <ResponsiveContainer width="100%" height={250}>
   <LineChart data={revenueData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="total"
    stroke="#4CAF50"
    strokeWidth={3}
    dot={{ r: 4 }}
  />
</LineChart>

    </ResponsiveContainer>
  </div>

  {/* 📊 Course Completion */}
  <div className="section-card">
    <h4>Course Completion Rate</h4>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={courseCompletion}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="course" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="completion_rate" fill="#3F51B5" radius={[8, 8, 0, 0]} />
</BarChart>

    </ResponsiveContainer>
  </div>

  {/* 📉 Assignment Difficulty */}
  <div className="section-card analytics-card">
  <div className="card-header">
    <h4>Assignment Difficulty</h4>
    <span className="card-subtitle">Lower avg score = harder assignment</span>
  </div>

  <ResponsiveContainer width="100%" height={260}>
    <BarChart
      data={assignmentDifficulty}
      margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
    >
      <defs>
        <linearGradient id="difficultyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF5252" />
          <stop offset="100%" stopColor="#FF8A80" />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
      <XAxis dataKey="assignment" tick={{ fontSize: 12 }} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />

      <Tooltip
        contentStyle={{
          backgroundColor: "#1e1e2f",
          borderRadius: "8px",
          border: "none",
          color: "#fff"
        }}
        formatter={(value) => [`Avg Score: ${value}`, ""]}
      />

      <Bar
        dataKey="avg_score"
        fill="url(#difficultyGradient)"
        radius={[10, 10, 0, 0]}
        barSize={45}
      >
        <LabelList
          dataKey="avg_score"
          position="top"
          fill="#ff5252"
          fontSize={12}
          formatter={(val) => `${val}`}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
   <div style={{ marginTop: "12px" }}>
    {assignmentDifficulty.map(a => (
      <div
        key={a.assignment}
        style={{
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "6px",
          color: a.avg_score < 40 ? "#F44336" : "#4CAF50"
        }}
      >
        {a.assignment} → {a.avg_score < 40 ? "Hard Assignment" : "Easy Assignment"}
      </div>
    ))}
  </div>
</div>


  {/* 📈 Performance Trend */}
 <div className="section-card analytics-card">
  <div className="card-header">
    <h4>Student Performance Trend</h4>
    <span className="card-subtitle">Average score over time</span>
  </div>

  <ResponsiveContainer width="100%" height={260}>
    <LineChart
      data={performanceTrend}
      margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
    >
      <defs>
        <linearGradient id="performanceGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />

      <Tooltip
        contentStyle={{
          backgroundColor: "#1e1e2f",
          borderRadius: "8px",
          border: "none",
          color: "#fff"
        }}
        formatter={(value) => [`Avg Score: ${value}`, ""]}
      />

      <Line
        type="monotone"
        dataKey="avg_score"
        stroke="url(#performanceGradient)"
        strokeWidth={3}
        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>


</div>

          {/* <div className="stats-grid">
  <div className="stat-card blue-gradient">
    <span>Total Logs</span>
    <h3>{auditStats.total || 0}</h3>
  </div>
  <div className="stat-card green-gradient">
    <span>Grade Changes</span>
    <h3>{auditStats.grade_changes || 0}</h3>
  </div>
  <div className="stat-card orange-gradient">
    <span>Last 24h</span>
    <h3>{auditStats.last_24h || 0}</h3>
  </div>
</div> */}

        </div>
      );
    }


    if (activeTab === "audit") {
      return (
        <div className="generic-tab-view fade-in">

          <div className="table-header-row">
            <h3>Audit Logs</h3>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        {new Date(log.created_at + "Z").toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata"
                        })}
                      </td>
                      <td>{log.user}</td>
                      <td>{log.action}</td>
                      <td>{log.resource}</td>
                      <td>
                        {log.event_type === "LOGIN_ATTEMPT" ? (
                          <span
                            style={{
                              color: log.details?.success ? "green" : "red",
                              fontWeight: "bold"
                            }}
                          >
                            Success: {log.details?.success ? "Yes" : "No"}
                          </span>
                        ) : (
                          <pre style={{ maxHeight: "120px", overflow: "auto" }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </td>
                      <td>{log.ip_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="generic-tab-view fade-in">
        <div className="table-header-row">
          <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>
          {activeTab !== "enrollments" && activeTab !== "payments" && activeTab !== "assignments" && activeTab !== "audit" && (
            <button className="add-record-btn" onClick={() => openModal(activeTab.slice(0, -1))}><Plus size={16} /> Add New</button>
          )}
        </div>
        {renderTable(activeTab)}
      </div>
    );
  };

  return (
    <div className="admin-dashboard-layout">
      <aside className="sidebar">
        {/* ... Sidebar Content ... */}
        <div className="sidebar-brand"><div className="brand-logo"><Book size={24} strokeWidth={2.5} /></div><div className="brand-text"><h2>Learning Management</h2><span>System</span></div></div>
        <nav className="sidebar-menu">
          <p className="menu-label">Main Menu</p>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}><Home size={20} /> Dashboard</button>
          <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}><Users size={20} /> Students</button>
          <button className={activeTab === "trainers" ? "active" : ""} onClick={() => setActiveTab("trainers")}><UserCheck size={20} /> Trainers</button>
          <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}><Book size={20} /> Courses</button>
          <button className={activeTab === "assignments" ? "active" : ""} onClick={() => setActiveTab("assignments")}><FileText size={20} /> Assignments</button>
          <button className={activeTab === "enrollments" ? "active" : ""} onClick={() => setActiveTab("enrollments")}><Clipboard size={20} /> Enrollments</button>
          <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}><Clipboard size={20} /> Payments</button>
          <button
            className={activeTab === "audit" ? "active" : ""}
            onClick={() => setActiveTab("audit")}
          >
            <Clipboard size={20} /> Audit Logs
          </button>

        </nav>
        <div className="sidebar-footer">
          <div className="user-profile-widget"><div className="avatar small">(A)</div><span>Admin</span></div>
          <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}><LogOut size={18} /><span>Sign Out</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div className="greeting"><h1>Admin Dashboard</h1><p>Welcome back, Administrator</p></div>
          <div className="top-actions">
            <div className="search-box"><Search size={16} /><input type="text" placeholder="Search..." /></div>
            <button className="icon-btn-header"><Bell size={18} /></button>
            <button className="primary-btn" onClick={() => openModal("student")}><Plus size={16} /> Add Student</button>
          </div>
        </header>
        <div className="content-wrapper">{renderContent()}</div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay fadeIn">
          <div className="modal-content slideIn">
            <div className="modal-header"><h2>{formData.id ? "Edit" : "Add"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2><button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">{renderForm()}</div>
              <div className="modal-footer"><button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button><button type="submit" className="btn-submit">{formData.id ? "Update" : "Add"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- RAG CHAT WIDGET --- */}
      <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
        {!isChatOpen && (
          <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
            <MessageCircle size={28} />
          </button>
        )}

        {isChatOpen && (
          <div className="chat-window fade-in">
            <div className="chat-header">
              <div className="chat-title">
                <MessageCircle size={18} />
                <span>AI Assistant</span>
              </div>
              <button className="close-chat" onClick={() => setIsChatOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chat-messages">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isChatLoading && (
                <div className="chat-bubble bot loading">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleChatSubmit}>
              <input
                type="text"
                placeholder="Ask about courses, students..."
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
              />
              <button type="submit" disabled={isChatLoading}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}

export default AdminDashboard;