import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PilotRegistration from "./Pages/PilotRegistration";
import PilotDashboard from "./Pages/PilotDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/pilot" replace />} />
        <Route path="/pilot" element={<PilotDashboard />} />
        <Route path="/pilot-registration" element={<PilotRegistration />} />
      </Routes>
    </Router>
  );
}

export default App;