import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import QuizList from './components/Quiz/QuizList';
import Quiz from './components/Quiz/Quiz';
import Results from './components/Quiz/Results';
import Leaderboard from './components/Quiz/Leaderboard';
import Dashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import QuizManagement from './components/Admin/QuizManagement';
import QuizEditor from './components/Admin/QuizEditor';
import useAuthStore from './stores/authStore';
import AdminLayout from './components/Admin/AdminLayout'; // Import AdminLayout
import PlayerLayout from './components/Player/PlayerLayout'; // Import PlayerLayout
import { jwtDecode } from 'jwt-decode';

function App() {
  const { accessToken } = useAuthStore();

  const isAdmin = () => {
    if (!accessToken) return false;
    try {
      const decoded = jwtDecode(accessToken);
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  const AdminRoute = ({ element }) => {
    return isAdmin() ? element : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes with AdminLayout */}
        <Route path="/admin" element={<AdminRoute element={<AdminLayout />} />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/quizzes" element={<QuizManagement />} />
          <Route path="/admin/quizzes/create" element={<QuizEditor />} />
          <Route path="/admin/quizzes/edit/:quizId" element={<QuizEditor />} />
        </Route>

        <Route path="/" element={<PlayerLayout />}>
          <Route
            index // Use index to render QuizList by default at "/"
            element={
              accessToken ? (
                <QuizList />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/results/:quizId" element={<Results />} />
          <Route path="/leaderboard/:quizId" element={<Leaderboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;