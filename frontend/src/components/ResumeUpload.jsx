import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { SnackbarContext } from '../context/SnackbarContext';

const ResumeUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      console.log(formData)
      const response = await uploadResume(formData, user.token);

      if (response.error) {
        throw new Error(response.error);
      }

      showSnackbar('Resume processed successfully!', 'success');
      if (onUploadSuccess) onUploadSuccess(response.data);

    } catch (err) {
      let errorMsg = 'Upload failed';

      // Handle specific error cases
      if (err.message.includes('parsing')) {
        errorMsg = 'The resume format is not supported or is corrupted. Try a different file.';
      } else if (err.message.includes('candidate data')) {
        errorMsg = 'We couldn\'t extract enough information from this resume. Please check the content.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center">Upload Resume</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Resume (PDF or DOCX)
          </label>
          <input
            type="file"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {error && <div className="p-3 text-red-700 bg-red-100 rounded-md">{error}</div>}

        <div className="flex justify-end pt-2 space-x-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeUpload;