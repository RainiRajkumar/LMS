import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./Admin/AdminDashboard";
import Login from "./Login";
import StudentDashboard from "./Student/StudentDashboard";
import TrainerDashboard from "./Trainer/TrainerDashboard";
import LandingPage from "./LandingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/trainer/dashboard" element={<TrainerDashboard/>} />
      </Routes>
    </Router>
  );
}

export default App;
