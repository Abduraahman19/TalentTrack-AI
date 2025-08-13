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
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {user.firstName} {user.lastName}
          </h1>
          <p className="text-xl font-semibold text-gray-600">Role: {user.role}</p>
        </div>
        <div className="space-x-4">
          {(user.role === 'admin' || user.role === 'recruiter') && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 text-white transition bg-blue-600 rounded hover:bg-blue-700"
            >
              {showUpload ? 'View Candidates' : 'Upload Resume'}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-white transition bg-red-500 rounded hover:bg-red-600"
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