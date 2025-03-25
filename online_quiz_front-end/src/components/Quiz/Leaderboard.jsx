import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './Leaderboard.css'; // Import CSS file

function Leaderboard() {
  const { quizId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/api/auth/quiz/${quizId}/leaderboard`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setLeaderboard(response.data.leaderboard);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch leaderboard');
      }
    };

    fetchLeaderboard();
  }, [quizId, accessToken]);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-heading">Leaderboard</h2>
      {error && <p className="leaderboard-error">{error}</p>}
      {!leaderboard && !error && (
        <p className="leaderboard-loading">Loading leaderboard...</p>
      )}
      {leaderboard && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.rank}>
                <td>{entry.rank}</td>
                <td>{entry.User_name}</td>
                <td>{entry.Score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;