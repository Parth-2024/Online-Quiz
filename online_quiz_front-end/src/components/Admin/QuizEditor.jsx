import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import './QuizEditor.css'; // Import CSS file


function QuizEditor() {
    const { accessToken } = useAuthStore();
    const { quizId } = useParams(); // Get quizId from URL if editing
    const navigate = useNavigate();
    let flag=-1;

    // Quiz state
    const [quizData, setQuizData] = useState({
        quiz_id: quizId || '', // Generate quiz_id if creating
        quiz_name: '',
        quiz_topic: '',
        end_time: '',
        randomiz: false,
    });
    const [questions, setQuestions] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // useEffect for fetching quiz data if editing
    useEffect(() => {
        if (quizId) {
            fetchQuizData(quizId);
        }
    }, [quizId, accessToken]);

    // const fetchQuizData = async (id) => {
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const response = await axios.get(`http://127.0.0.1:5000/api/auth/quizzes/${id}`, {
    //             headers: {
    //                 Authorization: `Bearer ${accessToken}`,
    //             },
    //         });
    //         const quiz = response.data.quiz;
    //         setQuizData({
    //             quiz_id: quiz.quiz_id,
    //             quiz_name: quiz.quiz_name,
    //             quiz_topic: quiz.quiz_topic,
    //             status: quiz.status,
    //             end_time: quiz.end_time,
    //             randomiz: quiz.randomiz,
    //         });
    //         setQuestions(quiz.questions || []); // Initialize questions
    //     } catch (err) {
    //         console.error('Error fetching quiz:', err);
    //         setError(err.response?.data?.error || 'Failed to fetch quiz');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchQuizData = async (id) => {
        setLoading(true);
        setError(null);
        try {
            // Fetch quiz details
            const quizResponse = await axios.get(`http://127.0.0.1:5000/api/auth/quizzes/${id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const quiz = quizResponse.data.quiz;
            setQuizData({
                quiz_id: quiz.quiz_id,
                quiz_name: quiz.quiz_name,
                quiz_topic: quiz.quiz_topic,
                status: quiz.status,
                end_time: quiz.end_time,
                randomiz: quiz.randomiz,
            });

            // Fetch questions for the quiz
            const questionsResponse = await axios.get(`http://127.0.0.1:5000/api/auth/quiz/${id}/questions`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const fetchedQuestions = questionsResponse.data['questions:']; // Access questions using the correct key

            // Update questions state
            setQuestions(fetchedQuestions ||[]);
        } catch (err) {
            console.error('Error fetching quiz data:', err);
            setError(err.response?.data?.error || 'Failed to fetch quiz data');
        } finally {
            setLoading(false);
        }
    };
    // Handle input changes for quiz details
    const handleQuizInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setQuizData({
            ...quizData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // Handle adding a new question
    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                ques_id: uuidv4(), // Generate a unique ID
                question: '',
                topic: '',
                points: 1,
                // quiz_id: quizData.quiz_id, // Assign quiz_id to the question
                ques_time_limit: 60,
                choices: [
                    { choice_id: uuidv4(), ch_text: '', is_correct: false },
                    { choice_id: uuidv4(), ch_text: '', is_correct: false },
                ],
            },
        ]);
    };

    // Handle question input changes
    const handleQuestionInputChange = (e, index) => {
        const { name, value } = e.target;
        const updatedQuestions = [...questions];
        updatedQuestions[index][name] = value;
        setQuestions(updatedQuestions);
    };

    // Handle adding a new choice to a question
    const handleAddChoice = (questionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].choices.push({
            choice_id: uuidv4(),
            ch_text: '',
            is_correct: false,
        });
        setQuestions(updatedQuestions);
    };

    // Handle choice input changes
    const handleChoiceInputChange = (e, questionIndex, choiceIndex) => {
        const { name, value, type, checked } = e.target;
        const updatedQuestions = [...questions];
        if (type === 'checkbox') {
            updatedQuestions[questionIndex].choices[choiceIndex][name] = checked;
        } else {
            updatedQuestions[questionIndex].choices[choiceIndex][name] = value;
        }
        setQuestions(updatedQuestions);
    };

    const handleSaveQuiz = async () => {
        setLoading(true);
        setError(null);
        try {
            let quizResponse;
            if (quizId) {
                // Update existing quiz
                flag=0;
                quizResponse = await axios.put(`http://127.0.0.1:5000/api/auth/quiz/${quizId}`, quizData, { // Changed payload
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            } else {
                // Create new quiz
                flag=1;
                quizResponse = await axios.post('http://127.0.0.1:5000/api/auth/quiz', quizData, { // Changed payload
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
            }

            const savedQuizId = quizResponse.data.quiz_id; // Extract quiz_id from response

            // 2 & 3. Update/Create Questions
            for (const question of questions) {
                let questionResponse;
                if (flag==0) {
                    // Update existing question
                    questionResponse = await axios.put(
                        `http://127.0.0.1:5000/api/auth/questions/${question.ques_id}`,
                        question, // Send the entire question object
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    );
                } else {
                    // Create new question
                    const questionPayload = {
                        ...question,
                        quiz_id: savedQuizId, // Use quizId for new questions
                    };
                    questionResponse = await axios.post(
                        'http://127.0.0.1:5000/api/auth/questions',
                        questionPayload,
                        {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    );
                }

                const savedQuesId = questionResponse.data.ques_id || question.ques_id; // Get ques_id from response or existing question

                // 4 & 5. Update/Create Choices
                for (const choice of question.choices) {
                    if (flag==0) {
                        // Update existing choice
                        await axios.put(
                            `http://127.0.0.1:5000/api/auth/choices/${choice.choice_id}`,
                            choice, // Send the entire choice object
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                },
                            }
                        );
                    } else {
                        // Create new choice
                        const choicePayload = {
                            ...choice,
                            ques_id: savedQuesId, // Use the ques_id
                        };
                        await axios.post('http://127.0.0.1:5000/api/auth/choices', choicePayload, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                            },
                        });
                    }
                }
            }

            navigate('/admin/quizzes'); // Redirect to quiz management
        } catch (err) {
            console.error('Error saving quiz:', err);
            setError(err.response?.data?.error || 'Failed to save quiz');
        } finally {
            setLoading(false);
        }
    };

    // Handle deleting a question
    const handleDeleteQuestion = (questionIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions.splice(questionIndex, 1);
        setQuestions(updatedQuestions);
    };

    // Handle deleting a choice
    const handleDeleteChoice = (questionIndex, choiceIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].choices.splice(choiceIndex, 1);
        setQuestions(updatedQuestions);
    };

return (
    <div className="quiz-editor-container">
        <h2 className="quiz-editor-heading">
        {quizId ? 'Edit Quiz' : 'Create New Quiz'}
        </h2>
    
        {loading && <p className="quiz-editor-loading">Loading...</p>}
        {error && <p className="quiz-editor-error">{error}</p>}
    
        {/* Quiz Details Form */}
        <form className="quiz-form">
        <div className="form-group">
          <label className="form-label">Quiz Id:</label>
          <input
            type="number"
            name="quiz_id"
            value={quizData.quiz_id}
            onChange={handleQuizInputChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Quiz Name:</label>
            <input
            type="text"
            name="quiz_name"
            value={quizData.quiz_name}
            onChange={handleQuizInputChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
            <label className="form-label">Quiz Topic:</label>
            <input
            type="text"
            name="quiz_topic"
            value={quizData.quiz_topic}
            onChange={handleQuizInputChange}
            required
            className="form-input"
            />
        </div>
        <div className="form-group">
            <label className="form-label">End Time:</label>
            <input
            type="datetime-local"
            name="end_time"
            value={quizData.end_time}
            onChange={handleQuizInputChange}
            required
            className="form-input"
            />
        </div>
        <div className="form-group">
            <label className="form-label">
            Randomize:
            <input
                type="checkbox"
                name="randomiz"
                checked={quizData.randomiz}
                onChange={handleQuizInputChange}
                className="form-checkbox"
            />
            </label>
        </div>
        </form>
    
        {/* Questions List */}
        <div className="questions-container">
        <h3>Questions</h3>
        {questions.map((question, questionIndex) => (
            <div
            key={question.ques_id}
            className="question-card"
            >
            <h4 className="question-heading">
                Question {questionIndex + 1}
            </h4>
            <button
                type="button"
                onClick={() => handleDeleteQuestion(questionIndex)}
                className="delete-button"
            >
                Delete Question
            </button>
            <div className="form-group">
                <label className="form-label">Question:</label>
                <input
                type="text"
                name="question"
                value={question.question}
                onChange={(e) => handleQuestionInputChange(e, questionIndex)}
                required
                className="form-input"
                />
            </div>
            <div className="form-group">
              <label className="form-label">Topic:</label>
                <input
                type="text"
                name="topic"
                value={question.topic}
                onChange={(e) => handleQuestionInputChange(e, questionIndex)}
                required
                className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Topic:</label>
                <input
                type="text"
                name="topic"
                value={question.topic}
                onChange={(e) => handleQuestionInputChange(e, questionIndex)}
                required
                className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Points:</label>
                <input
                type="number"
                name="points"
                value={question.points}
                onChange={(e) => handleQuestionInputChange(e, questionIndex)}
                required
                className="form-input"
                />
            </div>
            <div className="form-group">
                <label className="form-label">Time Limit (seconds):</label>
                <input
                type="number"
                name="ques_time_limit"
                value={question.ques_time_limit}
                onChange={(e) => handleQuestionInputChange(e, questionIndex)}
                required
                className="form-input"
                />
            </div>

            {/* Choices List */}
            <div className="choices-container">
                <h5>Choices</h5>
                {question.choices.map((choice, choiceIndex) => (
                <div
                    key={choice.choice_id}
                    className="choice-card"
                >
                    <button
                    type="button"
                    onClick={() =>
                        handleDeleteChoice(questionIndex, choiceIndex)
                    }
                    className="delete-button"
                    >
                    Delete Choice
                    </button>
                    <div className="form-group">
                    <label className="choice-label">Choice:</label>
                    <input
                        type="text"
                        name="ch_text"
                        value={choice.ch_text}
                        onChange={(e) =>
                        handleChoiceInputChange(
                            e,
                            questionIndex,
                            choiceIndex
                        )
                        }
                        required
                        className="choice-input"
                    />
                    </div>
                    <div className="form-group">
                    <label className="choice-label">
                        Is Correct:
                        <input
                        type="checkbox"
                        name="is_correct"
                        checked={choice.is_correct}
                        onChange={(e) =>
                            handleChoiceInputChange(
                            e,
                            questionIndex,
                            choiceIndex
                            )
                        }
                        className="choice-checkbox"
                        />
                    </label>
                    </div>
                </div>
                ))}
                <button
                type="button"
                onClick={() => handleAddChoice(questionIndex)}
                className="add-button"
                >
                Add Choice
                </button>
            </div>
            </div>
        ))}
        <button type="button" onClick={handleAddQuestion} className="add-button">
            Add Question
        </button>

        <button type="button" onClick={handleSaveQuiz} className="save-button">
            {quizId ? 'Update Quiz' : 'Create Quiz'}
        </button>
        </div>
    </div>
    );
}
export default QuizEditor;