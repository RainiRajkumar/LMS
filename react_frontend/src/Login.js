// import React, { useState } from "react";
// import axios from "axios";
// import { User, Lock, Shield, BookOpen, Award, ArrowRight, Loader } from "react-feather";
// import "./Login.css";

// function Login() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("student");
//   const [loading, setLoading] = useState(false);
//   const [shake, setShake] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [message, setMessage] = useState(""); // Alert message
//   const [messageType, setMessageType] = useState(""); // 'success' or 'error'


//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setShake(false);
//     setMessage("");
//     try {
//       let response;
//       // Adjust endpoint logic based on role
//       if (role === "admin") {
//         const formData = new FormData();
//         formData.append("username", username);
//         formData.append("password", password);
//         response = await axios.post("http://localhost:8000/admin/login", formData);
//       } else {
//         response = await axios.post(`http://localhost:8000/${role}/login`, { username, password });
//       }

//       const token = response.data.access_token;
//       localStorage.setItem("token", token);
//       localStorage.setItem("role", role);

//       setSuccess(true);      
//       setTimeout(() => setShake(false), 1000); 
//       setMessage("Login Successful!");
//       setMessageType("success")

//       // Delay redirect slightly to show success animation
//       setTimeout(() => {
//         if (role === "admin") window.location.href = "/admin/dashboard";
//         else if (role === "student") window.location.href = "/student/dashboard";
//         else if (role === "trainer") window.location.href = "/trainer/dashboard";
//       }, 800);

//     } catch (error) {
//       setShake(true);
//       setTimeout(() => setShake(false), 1000); // Reset shake after animation
//       setMessage("Invalid credentials! Please try again");
//       setMessageType("error");
//     } finally {
//       if (!success) setLoading(false);
//     }
//   };

//   // Helper to get current role config
//   const getRoleConfig = () => {
//     switch (role) {
//       case "admin": return { icon: <Shield size={32} />, label: "Administrator", color: "#e74c3c" };
//       case "trainer": return { icon: <Award size={32} />, label: "Trainer Portal", color: "#2ecc71" };
//       default: return { icon: <BookOpen size={32} />, label: "Student Portal", color: "#3498db" };
//     }
//   };

//   const config = getRoleConfig();

//   return (
//     <div className={`login-page ${role}-theme`}>
//       {/* Decorative Background Elements */}
//       <div className="background-shapes">
//         <div className="shape shape-1"></div>
//         <div className="shape shape-2"></div>
//         <div className="shape shape-3"></div>
//       </div>


//       <div className={`login-card ${shake ? "shake" : ""} ${success ? "success-exit" : ""}`}>

//         {/* Header Section */}
//         <div className="login-header">
//           <div className="icon-circle">{config.icon}</div>
//           <h2>{config.label}</h2>
//           <p>Welcome back! Please sign in.</p>
//         </div>

//         {/* Role Tabs */}
//         <div className="role-switcher">
//           {["student", "trainer", "admin"].map((r) => (
//             <button
//               key={r}
//               type="button"
//               className={role === r ? "active" : ""}
//               onClick={() => setRole(r)}
//             >
//               {r.charAt(0).toUpperCase() + r.slice(1)}
//             </button>
//           ))}
//           <div className={`sliding-indicator ${role}`}></div>
//         </div>

//         {/* Form */}
//         {message && (
//           <div className={`alert ${messageType}`}>
//             {message}
//           </div>
//         )}
//         <form onSubmit={handleLogin} className="login-form">

//           <div className="input-group">
//             <div className="input-icon"><User size={18} /></div>
//             <div className="floating-label-container">
//               <input
//                 type="text"
//                 id="username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//                 placeholder=" "
//               />
//               <label htmlFor="username">Username</label>
//             </div>
//           </div>

//           <div className="input-group">
//             <div className="input-icon"><Lock size={18} /></div>
//             <div className="floating-label-container">
//               <input
//                 type="password"
//                 id="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 placeholder=" "
//               />
//               <label htmlFor="password">Password</label>
//             </div>
//           </div>

//           <button
//             type="submit"
//             className={`login-button ${loading ? "loading" : ""} ${success ? "success" : ""}`}
//             disabled={loading || success}
//           >
//             {loading ? <Loader className="spinner" size={20} /> : (
//               success ? "Success!" : <>Login <ArrowRight size={18} /></>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Login;



import { useState } from "react";
import axios from "axios";
import { User, Lock, ArrowRight, Loader, ArrowLeft } from "react-feather";
import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import "./Login.css";

function Login() {
  const [role, setRole] = useState(null); // null = show card selection
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSnackbarClose = (event, reason) => {
  if (reason === 'clickaway') return;
  setSnackbarOpen(false);
};



  // Exact Colors from the video
  const roleData = {
    student: {
      id: 'student',
      title: 'Student',
      description: 'Access your courses, assignments, and track your learning progress.',
      color: '#38bdf8', // Bright Cyan Blue
      avatar: './student-avatar.png'
    },
    admin: {
      id: 'admin',
      title: 'Administrator',
      description: 'Manage users, courses, and system settings with full control.',
      color: '#e879f9', // Neon Purple/Pink
      avatar: './admin-avatar.png'
    },
    trainer: {
      id: 'trainer',
      title: 'Trainer',
      description: 'Create courses, manage students, and track performance metrics.',
      color: '#2dd4bf', // Bright Teal Green
      avatar: './trainer-avatar.png'
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShake(false);
    setMessage("");

    try {
      let response;
      if (role === "admin") {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);
        response = await axios.post("http://localhost:8000/admin/login", formData);
      } else {
        response = await axios.post(`http://localhost:8000/${role}/login`, { username, password });
      }

      const token = response.data.access_token;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      setSuccess(true);
      setMessage("Login Successful!");
      setMessageType("success");
      setSnackbarOpen(true);


      setTimeout(() => {
        if (role === "admin") window.location.href = "/admin/dashboard";
        else if (role === "student") window.location.href = "/student/dashboard";
        else if (role === "trainer") window.location.href = "/trainer/dashboard";
      }, 1000);

    } catch (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setMessage("Invalid credentials! Please try again");
      setMessageType("error");
      setSnackbarOpen(true);
    } finally {
      if (!success) setLoading(false);
    }
  };

  // --- VIEW 1: Role Selection ---
  if (!role) {
    return (
      <div className="portal-container">
        <div className="header">
          <h1>Welcome to EduPortal</h1>
          <p>Select your role to continue to the learning management system</p>
        </div>

        <div className="cards-wrapper">
          {Object.keys(roleData).map((key) => {
            const r = roleData[key];
            return (
              <div 
                key={key} 
                className="role-card" 
                onClick={() => setRole(key)}
                // We pass the color to CSS as a variable
                style={{ '--card-color': r.color }}
              >
                {/* The "Nebula" Glow Background */}
                <div className="glow-effect"></div>

                {/* The Floating Avatar */}
                <div className="avatar-wrapper">
                  <div className="avatar-circle">
                    <img src={r.avatar} alt={r.title} />
                  </div>
                </div>

                <h2>{r.title}</h2>
                <p>{r.description}</p>
                
                <div className="indicator-line"></div>
              </div>
            );
          })}
        </div>
        
        <div className="footer">
          <p>Need help? Contact <a href="mailto:support@eduportal.com">support@eduportal.com</a></p>
        </div>
      </div>
    );
  }

  // --- VIEW 2: Login Form ---
  const currentRoleConfig = roleData[role];

  return (
    <div className="portal-container">
      <div className={`login-card ${shake ? "shake" : ""} ${success ? "success-exit" : ""}`}>
        
        <button className="back-btn" onClick={() => { setRole(null); setMessage(""); setUsername(""); setPassword(""); }}>
           <ArrowLeft size={16} /> Change Role
        </button>

        <div className="login-header">
          <div className="avatar-small" style={{borderColor: currentRoleConfig.color}}>
             <img src={currentRoleConfig.avatar} alt="avatar" />
          </div>
          <h2 style={{color: currentRoleConfig.color}}>{currentRoleConfig.title} Login</h2>
          <p>Please sign in to continue.</p>
        </div>

<Snackbar
  open={snackbarOpen}
  autoHideDuration={3000}
  onClose={handleSnackbarClose}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert
    onClose={handleSnackbarClose}
    severity={messageType === "success" ? "success" : "error"}
    variant="filled"
    sx={{ width: '100%' }}
  >
    {message}
  </Alert>
</Snackbar>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <div className="input-icon" style={{color: currentRoleConfig.color}}>
                <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ borderColor: username ? currentRoleConfig.color : '#334155' }}
            />
          </div>

          <div className="input-group">
            <div className="input-icon" style={{color: currentRoleConfig.color}}>
                <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderColor: password ? currentRoleConfig.color : '#334155' }}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            style={{ backgroundColor: currentRoleConfig.color }}
            disabled={loading || success}
          >
            {loading ? <Loader className="spinner" size={20} /> : (
              success ? "Success!" : <>Login <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;