// Example for UploadResumePage.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ResumeUpload from '../components/ResumeUpload';
import Layout from '../components/Layout/Layout';
import MobileHeader from '../components/Layout/MobileHeader';

const UploadResumePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <Layout>
      <MobileHeader />
      
      <div className="flex-1 p-4 overflow-y-auto md:p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Upload Resume</h1>
          <p className="text-gray-600">
            Upload candidate resumes in PDF or DOCX format. The system will automatically extract and analyze the content.
          </p>
        </div>
        
        {user?.role === 'recruiter' || user?.role === 'admin' ? (
          <ResumeUpload />
        ) : (
          <div className="p-4 text-red-700 bg-red-100 rounded">
            You don't have permission to upload resumes.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadResumePage;
