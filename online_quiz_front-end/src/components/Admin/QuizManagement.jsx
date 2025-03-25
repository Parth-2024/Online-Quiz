// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import useAuthStore from '../../stores/authStore';
// import { Link } from 'react-router-dom';

// function QuizManagement() {
//   const [quizzes, setQuizzes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { accessToken } = useAuthStore();

//   useEffect(() => {
//     const fetchQuizzes = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         console.log("Fetching quizzes...");
//         const response = await axios.get('http://127.0.0.1:5000/api/auth/quizzes', {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         });
//         console.log("Quizzes fetched:", response.data.quizzes);
//         setQuizzes(response.data.quizzes);
//       } catch (err) {
//         console.error("Fetch error:", err);
//         setError(err.response?.data?.error || 'Failed to fetch quizzes');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchQuizzes();
//   }, [accessToken]);

//   return (
//     <div>
//       <h2>Quiz Management</h2>
//       <Link to="/admin/quizzes/create">Create New Quiz</Link>
//       {loading && <p>Loading quizzes...</p>}
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <ul>
//         {quizzes.map((quiz) => (
//           <li key={quiz.quiz_id}>
//             {quiz.quiz_name} - {quiz.quiz_topic} - Status: {quiz.status} - End Time: {quiz.end_time} - Randomize: {quiz.randomiz ? 'Yes' : 'No'}
//             <Link to={`/admin/quizzes/edit/${quiz.quiz_id}`}>Edit</Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// export default QuizManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import './QuizManagement.css'; // Import CSS file

function QuizManagement() {
    const { accessToken } = useAuthStore();
    const [quizzes, setQuizzes] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, [accessToken]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://127.0.0.1:5000/api/auth/quizzes', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setQuizzes(response.data.quizzes);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError(err.response?.data?.error || 'Failed to fetch quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (window.confirm("Are you sure you want to delete this quiz?")) {
            try {
                await axios.delete(`http://127.0.0.1:5000/api/auth/quiz/${quizId}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                // Remove the deleted quiz from the state
                setQuizzes(quizzes.filter(quiz => quiz.quiz_id !== quizId));
            } catch (err) {
                console.error('Error deleting quiz:', err);
                setError(err.response?.data?.error || 'Failed to delete quiz');
            }
        }
    };


    if (loading) {
        return <div>Loading quizzes...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div  className="quiz-management-container">
            <h2 className="quiz-management-heading">Quiz Management</h2>
            <Link to="/admin/quizzes/create" className="create-quiz-button">Create New Quiz</Link>
            <div clasName="table-wrapper">
              <table className="quiz-table">
                  <thead>
                      <tr>
                          <th>Quiz ID</th>
                          <th>Quiz Name</th>
                          <th>Quiz Topic</th>
                          <th>Status</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {quizzes.map((quiz) => (
                          <tr key={quiz.quiz_id}>
                              <td>{quiz.quiz_id}</td>
                              <td>{quiz.quiz_name}</td>
                              <td>{quiz.quiz_topic}</td>
                              <td>{quiz.status}</td>
                              <td className="actions-column">
                                  <Link to={`/admin/quizzes/edit/${quiz.quiz_id}`} className="edit-button">Edit</Link>
                                  <button onClick={() => handleDeleteQuiz(quiz.quiz_id)} className="delete-button">Delete</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </div>
    );
}

export default QuizManagement;