import { useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import ResumeUpload from '../components/ResumeUpload';

const UploadResumePage = () => {
  const { user } = AuthContext();
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Upload Resume</h1>
      
      {user.role === 'recruiter' || user.role === 'admin' ? (
        <>
          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              Resume uploaded successfully!
            </div>
          )}
          <ResumeUpload token={user.token} onUpload={handleUploadSuccess} />
        </>
      ) : (
        <div className="bg-red-100 text-red-700 p-4 rounded">
          You don't have permission to upload resumes.
        </div>
      )}
    </div>
  );
};

export default UploadResumePage;