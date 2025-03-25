import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './Quiz.css'; // Import CSS file

function Quiz() {
  const { quizId } = useParams();
  console.log("Quiz ID:", quizId);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:5000/api/auth/quiz/${quizId}/questions`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setQuestions(response.data["questions:"]);
        console.log("Questions:", response.data.questions);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch questions');
      }
    };

    fetchQuestions();
  }, [quizId, accessToken]);

  const handleAnswerChange = (questionId, choiceId) => {
    setAnswers({ ...answers, [questionId]: choiceId });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        'http://127.0.0.1:5000/api/auth/submit_quiz',
        {
          quiz_id: quizId,
          answers: Object.keys(answers).map((questionId) => ({
            ques_id: questionId,
            selected_choice_id: answers[questionId],
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      navigate(`/results/${quizId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    }
  };

  return (
    <div className="quiz-container">
      <h2 className="quiz-heading">Quiz</h2>
      {error && <p className="quiz-error">{error}</p>}
      {questions.map((question) => (
        <div key={question.ques_id} className="quiz-question">
          <h3>{question.question}</h3>
          <ul className="quiz-choices">
            {question.choices.map((choice) => (
              <li key={choice.choice_id} className="quiz-choice">
                <label>
                  <input
                    type="radio"
                    name={`question-${question.ques_id}`}
                    value={choice.choice_id}
                    onChange={() =>
                      handleAnswerChange(question.ques_id, choice.choice_id)
                    }
                  />
                  {choice.ch_text}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button onClick={handleSubmit} className="quiz-submit-button">
        Submit Quiz
      </button>
    </div>
  );
}

export default Quiz;