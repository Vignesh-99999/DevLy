// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Landing from "./components/Landing";
import Home from "./components/Home";
import ProfessorChat from "./components/ProfessorChat";
import ProfessorDashboard from "./components/ProfessorDashboard";
import TutorialTable from "./components/TutorialTable";
import TestManagement from "./components/TestManagement";
import TestList from "./components/student-pages/TestList";
import TakeTest from "./components/student-pages/TakeTest";

import VerifyOtp from "./components/VerifyOtp";

import VerifyEmail from "./components/VerifyEmail";

const Forget = () => <h1>Forgot Password Page</h1>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forget" element={<Forget />} />

        {/* Default to Python */}
        {/* <Route path="/tutorial" element={<TutorialTable />} /> */}
        {/* Language-specific tutorials */}
        <Route path="/tutorial/:language" element={<TutorialTable />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/professor" element={<ProfessorChat />} />
        <Route path="/professor-dashboard" element={<ProfessorDashboard />} />
        <Route path="/test-management" element={<TestManagement />} />
        <Route path="/tests" element={<TestList />} />
        <Route path="/take-test/:id" element={<TakeTest />} />

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
