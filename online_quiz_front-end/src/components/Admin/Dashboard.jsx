import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../stores/authStore';
import './Dashboard.css'; // Import CSS file

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/auth/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch dashboard data');
      }
    };

    fetchDashboardData();
  }, [accessToken]);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-heading">Admin Dashboard</h2>
      {error && <p className="dashboard-error">{error}</p>}
      {!dashboardData && !error && (
        <p className="dashboard-loading">Loading dashboard data...</p>
      )}
      {dashboardData && (
        <div className="dashboard-content">
          <div className="dashboard-metrics">
            <div className="dashboard-metric-card">
              <h3>Average Points per Quiz</h3>
              <p>{dashboardData.avg_points_per_quiz}</p>
            </div>
            <div className="dashboard-metric-card">
              <h3>Average Time Taken per Quiz</h3>
              <p>{dashboardData.avg_time_taken_per_quiz}</p>
            </div>
          </div>

          <div className="dashboard-table-section">
            <h3>Players</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Quiz Attempts</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.players.map((player) => (
                  <tr key={player.user_id}>
                    <td>{player.user_id}</td>
                    <td>{player.user_name}</td>
                    <td>{player.num_quiz_attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dashboard-table-section">
            <h3>Questions</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Question ID</th>
                  <th>Question</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.questions.map((question) => (
                  <tr key={question.ques_id}>
                    <td>{question.ques_id}</td>
                    <td>{question.question}</td>
                    <td>{question.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;