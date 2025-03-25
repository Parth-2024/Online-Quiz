import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import './QuizList.css'; // Import CSS file


function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/auth/quizzes', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setQuizzes(response.data.quizzes);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch quizzes');
      }
    };

    fetchQuizzes();
  }, [accessToken]);

  const handleQuizSelect = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div className="quiz-list-container">
      <h2 className="quiz-list-heading">Quiz List</h2>
      {error && <p className="quiz-list-error">{error}</p>}
      <ul className="quiz-list-ul">
        {quizzes.map((quiz) => (
          <li key={quiz.quiz_id} className="quiz-list-li">
            <div>
              {quiz.quiz_name} - {quiz.quiz_topic} - Status: {quiz.stat}
            </div>
            <button
              onClick={() => handleQuizSelect(quiz.quiz_id)}
              className="quiz-list-button"
            >
              Take Quiz
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuizList;