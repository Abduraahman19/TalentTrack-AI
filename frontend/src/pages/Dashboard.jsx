import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import CandidateList from "../components/CandidateList";
import ResumeUpload from "../components/ResumeUpload";

const Dashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    setRefreshKey(prev => prev + 1); // Refresh candidate list
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">
          <span>Role: {user.role}</span> <br/>
          Welcome, {user.firstName} {user.lastName}
        </h1>
        <div className="space-x-4">
          {(user.role === 'admin' || user.role === 'recruiter') && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {showUpload ? 'View Candidates' : 'Upload Resume'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {showUpload ? (
        <ResumeUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <CandidateList key={refreshKey} />
      )}
    </div>
  );
};

export default Dashboard;