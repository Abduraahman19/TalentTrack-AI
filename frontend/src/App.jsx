import { Routes, Route } from 'react-router-dom';
import LoginRegisterPage from './pages/LoginRegisterPage';
import Dashboard from './pages/Dashboard';
import UploadResumePage from './pages/UploadResume';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRegisterPage />} />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute requireAdmin>
            <UploadResumePage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;