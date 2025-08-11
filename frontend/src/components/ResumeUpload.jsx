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

      console.log('Uploading file:', file.name, file.size, file.type);

      const response = await uploadResume(formData, user.token);
      console.log('Upload successful:', response.data);

      showSnackbar('Resume uploaded and parsed successfully!', 'success');

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }

      setFile(null);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload Resume</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume (PDF or DOCX)
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <span className="text-gray-500">Click to upload or drag and drop</span>
          </label>
          {file && <p className="mt-2 text-sm text-gray-600">Selected file: {file.name}</p>}
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Upload Resume'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeUpload;
