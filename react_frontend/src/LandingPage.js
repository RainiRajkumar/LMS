import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import AOS from "aos";
import "aos/dist/aos.css";

function LandingPage() {
  const navigate = useNavigate();

  const handleNavigate = (role) => {
    navigate("/login");
  };

  useEffect(() => {
    AOS.init({ duration: 1200, once: true });
  }, []);

  return (
    <div className="lms-container">
      
      {/* ========================= HERO SECTION ========================= */}
      <section className="lms-hero">
        <div className="lms-hero-content" data-aos="fade-right">
          <h1>Learn. Manage. Excel.</h1>
          <p>
            A complete Learning Management System for Students, Trainers, and Administrators.
          </p>

          <div className="lms-buttons">
            <button className="lms-btn admin" onClick={() => handleNavigate("admin")}>Admin</button>
            <button className="lms-btn student" onClick={() => handleNavigate("student")}>Student</button>
            <button className="lms-btn trainer" onClick={() => handleNavigate("trainer")}>Trainer</button>
          </div>
        </div>

        <div className="lms-interactive-img" data-aos="zoom-in">
 <img
            src="/lms_dashboard.png"
            alt="LMS Graphic"
          />



        </div>
      </section>

      {/* ========================= FEATURES ========================= */}
      <section className="lms-features">
        <h2 data-aos="fade-up">Powerful LMS Features</h2>

        <div className="lms-feature-grid">
          
          <div className="lms-card" data-aos="flip-left">
            <img src="https://img.icons8.com/fluency/96/classroom.png" alt="Courses" />
            <h3>Course Management</h3>
            <p>Create, update, schedule & organize course materials smoothly.</p>
          </div>

          <div className="lms-card" data-aos="flip-left" data-aos-delay="150">
            <img src="https://img.icons8.com/color/96/student-center.png" alt="Students" />
            <h3>Student Tracking</h3>
            <p>Monitor student progress, attendance, exams & overall performance.</p>
          </div>

          <div className="lms-card" data-aos="flip-left" data-aos-delay="300">
<img src="https://img.icons8.com/color/96/training.png" alt="Trainer Dashboard" />
            <h3>Trainer Dashboard</h3>
            <p>Manage classes, assignments, grading, and communication tools.</p>
          </div>

          <div className="lms-card" data-aos="flip-left" data-aos-delay="450">
            <img src="https://img.icons8.com/color/96/settings--v1.png" alt="Admin" />
            <h3>Admin Control</h3>
            <p>Full access to users, roles, analytics & LMS customization.</p>
          </div>

          <div className="lms-card" data-aos="flip-left" data-aos-delay="600">
            <img src="https://img.icons8.com/color/96/combo-chart--v1.png" alt="Analytics" />
            <h3>Advanced Analytics</h3>
            <p>Real-time insights for students, trainers, and course performance.</p>
          </div>

          <div className="lms-card" data-aos="flip-left" data-aos-delay="750">
<img src="https://img.icons8.com/color/96/test-passed.png" alt="Online Exams" />
            <h3>Online Exams</h3>
            <p>Auto-proctored quizzes, instant evaluation & progress history.</p>
          </div>

        </div>
      </section>

      {/* ========================= INTERACTIVE SECTION ========================= */}
      <section className="lms-interactive">
        <div className="lms-interactive-text" data-aos="fade-right">
          <h2>Interactive Learning Experience</h2>
          <p>
            Our LMS makes learning fun with animations, dynamic UI, course gamification,
            badges, progress bars & visual feedback.
          </p>

          <button className="lms-explore-btn">Explore More →</button>
        </div>

        <div className="lms-interactive-img" data-aos="fade-left">
           <img src="/lms.jpg" alt="Interactive Learning" />


        </div>
      </section>

      {/* ========================= FOOTER ========================= */}
      <footer className="lms-footer">
        <p>© 2025 Learning Management System. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
