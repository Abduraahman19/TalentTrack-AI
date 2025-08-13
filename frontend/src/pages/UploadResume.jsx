import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ResumeUpload from '../components/ResumeUpload';

const UploadResumePage = () => {
  const { user } = useContext(AuthContext); // ✅ Correct way
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Upload Resume</h1>

      {user?.role === 'recruiter' || user?.role === 'admin' ? (
        <>
          {uploadSuccess && (
            <div className="p-3 mb-4 text-green-700 bg-green-100 rounded">
              Resume uploaded successfully!
            </div>
          )}
          <ResumeUpload token={user?.token} onUpload={handleUploadSuccess} />
        </>
      ) : (
        <div className="p-4 text-red-700 bg-red-100 rounded">
          You don't have permission to upload resumes.
        </div>
      )}
    </div>
  );
};

export default UploadResumePage;
