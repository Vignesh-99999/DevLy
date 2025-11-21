import React from 'react';
import '../Landing.css';
import Ballpit from '../blocks/Backgrounds/Ballpit/Ballpit';  
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/auth?mode=signin'); // 👈 go to login mode
  };

  const handleSignupClick = () => {
    navigate('/auth?mode=signup'); // 👈 go to signup mode
  };

  const handleExploreClick = () => {
    navigate('/Home');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Background Ballpit */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Ballpit
          count={200}
          gravity={0.1}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={false}
          colors={[
            "#2563EB", // blue
            "#06B6D4", // cyan
            "#F59E0B", // amber
            "#10B981", // green
            "#1E293B", // dark slate
          ]}
        />
      </div>

      {/* Foreground Content */}
      <div className="landing-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="landing-content focus-box">
          <h1>Master Programming Languages Online</h1>
          <p>
            Join thousands of students learning to code in Python, Java, C++, and C.<br />
            Our interactive platform is built for beginners and advanced learners alike.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={handleLoginClick} className="login-btn">
              Login
            </button>
            <button 
              onClick={handleSignupClick} 
              className="login-btn" 
              style={{ background: 'linear-gradient(135deg, #ffeb3b, #f59e0b)', color: '#0d47a1' }}
            >
              Sign Up
            </button>
            <button 
              onClick={handleExploreClick} 
              className="login-btn" 
              style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}
            >
              Explore Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
