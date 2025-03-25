import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './Results.css'; // Import CSS file

function Results() {
  const { quizId } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/api/auth/results/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setResult(response.data.result);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch results');
      }
    };

    fetchResults();
  }, [quizId, accessToken]);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="results-container">
      <h2 className="results-heading">Quiz Results</h2>
      {error && <p className="results-error">{error}</p>}
      {!result && !error && <p className="results-loading">Loading results...</p>}
      {result && (
        <div className="results-details">
          <p>Score: {result.score}</p>
          <p>Time Taken: {result.time_taken}</p>
          {/* Add more details as needed */}
        </div>
      )}
    </div>
  );
}

export default Results;