import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Book,
  FileText,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Clipboard, 
  Home,
  LogOut,
  ChevronRight,
  Search,
  Bell
} from "react-feather";
import "./AdminDashboard.css";


function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [formData, setFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const token = localStorage.getItem("token");
  const [payments, setPayments] = useState([]);



  useEffect(() => {
    fetchStudents();
    fetchTrainers();
    fetchCourses();
    fetchAssignments();
    fetchEnrollments();
    fetchPayments();
  }, []);

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
    const res = await axios.get(
      "http://localhost:8000/payment/admin/all",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    setPayments(res.data);
  } catch (err) {
    console.error("Error loading payments:", err);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = "";
    let method = "post";
    let data = { ...formData };
    
    if (modalType === "student" && data.id && !data.password) delete data.password;

    let fetcher = () => {};

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
    setFormData(itemCopy);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      let url = "";
      let fetcher = () => {};
      if (type === "student") { url = `http://localhost:8000/students/${id}`; fetcher = fetchStudents; }
      else if (type === "trainer") { url = `http://localhost:8000/admin/trainers/${id}`; fetcher = fetchTrainers; }
      else if (type === "course") { url = `http://localhost:8000/admin/courses/${id}`; fetcher = fetchCourses; }

      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      fetcher();
    } catch (err) { alert("Delete failed"); }
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({});
    setIsModalOpen(true);
  };

  const renderForm = () => {
    // Form rendering logic remains the same as your code...
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

    if (!data.length) return <div className="empty-table">No records found.</div>;
    const showActions = type === 'students' || type === 'trainers' || type === 'courses';

    return (
      <div className="table-container fade-in">
        <table className="admin-table">
          <thead>
            <tr>
              {Object.keys(data[0]).filter((key) => key !== "password").map((key) => (
                <th key={key}>{key.replace(/_/g, " ")}</th>
              ))}
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
          {/* Top Cards Row */}
          <div className="stats-grid">
            {/* Card 1: Blue - Students */}
            <div className="stat-card blue-gradient">
              <div className="stat-content">
                <span>Active Students</span>
                <h3>{students.length}</h3>
              </div>
              <div className="stat-icon">
                <Users size={24} />
              </div>
            </div>

            {/* Card 2: Purple - Courses */}
            <div className="stat-card purple-gradient">
              <div className="stat-content">
                <span>Active Courses</span>
                <h3>{courses.length}</h3>
              </div>
              <div className="stat-icon">
                <Book size={24} />
              </div>
            </div>

            {/* Card 3: Green - Assignments */}
            <div className="stat-card green-gradient">
              <div className="stat-content">
                <span>Assignments</span>
                <h3>{assignments.length || 0}</h3>
              </div>
              <div className="stat-icon">
                <FileText size={24} />
              </div>
            </div>

            {/* Card 4: Orange - Pending/Trainers */}
            <div className="stat-card orange-gradient">
              <div className="stat-content">
                <span>Active Trainers</span>
                <h3>{trainers.length}</h3>
              </div>
              <div className="stat-icon">
                <AlertCircle size={24} />
              </div>
            </div>
          </div>

          {/* Bottom Split Section */}
          <div className="dashboard-bottom-grid">
            
            {/* Left: Upcoming Assignments */}
            <div className="section-card assignments-section">
              <div className="card-header">
                <h4>Upcoming Assignments</h4>
                <a href="#viewall" className="view-all-link">View All <ChevronRight size={14}/></a>
              </div>
              
              <div className="assignments-list">
                {assignments.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={40} />
                        <p>No upcoming assignments.</p>
                    </div>
                ) : (
                    assignments.slice(0, 3).map((a, index) => (
                    <div key={index} className="assignment-item">
                        <div className="assign-icon-box">
                            <FileText size={20} />
                        </div>
                        <div className="assign-details">
                            <h5>{a.title}</h5>
                            <span className="assign-course">{a.description}</span>
                        </div>
                        <div className="assign-meta">
                            <span className="points">{a.max_score} score</span>
                            <span className="due-date">Due: {a.due_date || "Dec 09"}</span>
                        </div>
                    </div>
                    ))
                )}
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="section-card quick-actions-section">
               <div className="card-header">
                <h4>Quick Actions</h4>
              </div>
              <div className="actions-grid">
                <button className="action-tile" onClick={() => openModal("student")}>
                    <div className="tile-icon blue"><Users size={20}/></div>
                    <span>Add Student</span>
                </button>
                <button className="action-tile" onClick={() => openModal("course")}>
                    <div className="tile-icon purple"><Book size={20}/></div>
                    <span>Add Course</span>
                </button>
                <button className="action-tile" onClick={() => openModal("trainer")}>
                    <div className="tile-icon orange"><UserCheck size={20}/></div>
                    <span>Add Trainer</span>
                </button>
                <button className="action-tile" onClick={() => setActiveTab("enrollments")}>
                    <div className="tile-icon green"><Clipboard size={20}/></div>
                    <span>Enrollments</span>
                </button>
                
             
              </div>
            </div>

          </div>
        </div>
      );
    }

    // Other Tabs
    return (
   <div className="generic-tab-view fade-in">
    <div className="table-header-row">
        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>

        {/* Hide Add Button for enrollments AND payments */}
        {activeTab !== "enrollments" && activeTab !== "payments" &&  activeTab !=="assignments" && (
            <button 
                className="add-record-btn" 
                onClick={() => openModal(activeTab.slice(0, -1))}
            >
                <Plus size={16} /> Add New
            </button>
        )}
    </div>

    {renderTable(activeTab)}
</div>

    );
  };

  return (
    <div className="admin-dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Book size={24} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h2>Learning Management</h2>
            <span>System</span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <p className="menu-label">Main Menu</p>
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
            <Home size={20} /> Dashboard
          </button>
          <button className={activeTab === "students" ? "active" : ""} onClick={() => setActiveTab("students")}>
            <Users size={20} /> Students
          </button>
          <button className={activeTab === "trainers" ? "active" : ""} onClick={() => setActiveTab("trainers")}>
            <UserCheck size={20} /> Trainers
          </button>
          <button className={activeTab === "courses" ? "active" : ""} onClick={() => setActiveTab("courses")}>
            <Book size={20} /> Courses
          </button>
          <button className={activeTab === "assignments" ? "active" : ""} onClick={() => setActiveTab("assignments")}>
             <FileText size={20} /> Assignments
          </button>
          <button className={activeTab === "enrollments" ? "active" : ""} onClick={() => setActiveTab("enrollments")}>
            <Clipboard size={20} /> Enrollments
          </button>
           <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>
            <Clipboard size={20} /> Payments
          </button>
        </nav>

     
        <div className="sidebar-footer">
          <div className="user-profile-widget">
                <div className="avatar small">(A)</div>
                <span>Admin</span>
            </div>
  <button 
    className="logout-btn" 
    onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
  >
    <LogOut size={18} />
    <span>Sign Out</span>
  </button>
</div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="greeting">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, Administrator</p>
          </div>
          <div className="top-actions">
            <div className="search-box">
                <Search size={16}/>
                <input type="text" placeholder="Search..." />
            </div>
            <button className="icon-btn-header"><Bell size={18}/></button>
            <button className="primary-btn" onClick={() => openModal("student")}>
               <Plus size={16}/> Add Student
            </button>
          </div>
        </header>

        <div className="content-wrapper">
            {renderContent()}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay fadeIn">
          <div className="modal-content slideIn">
            <div className="modal-header">
              <h2>{formData.id ? "Edit" : "Add"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {renderForm()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">{formData.id ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;