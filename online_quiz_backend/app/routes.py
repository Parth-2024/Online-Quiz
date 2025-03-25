from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from sqlalchemy import func
from flask_cors import cross_origin
import uuid
from .models import User, Quiz, Question, Choice, Result, db
from . import bcrypt

auth_bp=Blueprint('auth',__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data=request.get_json()
    email=data.get('email')
    password=data.get('password')

    if User.query.filter_by(email=email).first():
        return jsonify({'error':'Email already exists'}), 400
    
    hashed_password=bcrypt.generate_password_hash(password).decode('utf-8')
    new_user=User(user_name=data.get('user_name'), email=email, password=hashed_password, rl=data.get('role'))

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message':'User successfully registered'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data=request.get_json()
    email=data.get('email')
    password=data.get('password')

    user=User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        access_token=create_access_token(identity=user.user_id)
        refresh_token=create_refresh_token(identity=user.user_id)
        return jsonify({'access_token':access_token, 'refresh_token':refresh_token})
    return jsonify({'error':'Invalid credentials'}), 401

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user=get_jwt_identity()
    new_token=create_access_token(identity=current_user)
    return jsonify({'access_token':new_token}), 200

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user=get_jwt_identity()
    return jsonify({'message':f'Hello {current_user}'}), 200

@auth_bp.route('/quiz', methods=['OPTIONS', 'POST']) # Updated route
@cross_origin()
@jwt_required()
def create_quiz():
    if request.method == 'OPTIONS':
        return jsonify({"message": "Options request successful"}), 200
    print("Create quiz route hit")
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error":"You aren't authorized to create quizzes"}), 403
    
    data=request.get_json()
    quiz_name=data.get('quiz_name')
    quiz_id=data.get('quiz_id')
    quiz_topic=data.get('quiz_topic')
    end_time=data.get('end_time')
    randomiz=data.get('randomiz')
    
    if Quiz.query.get(quiz_id):
        return jsonify({"error":"Quiz already exists"})

    new_quiz = Quiz(
        quiz_id=quiz_id,
        quiz_name=quiz_name,
        quiz_topic=quiz_topic,
        end_time=end_time,
        randomiz=randomiz,
        crt_by=current_user
    )

    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({'message':'Quiz successfully created', 'quiz_id':new_quiz.quiz_id}), 201

@auth_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def get_quizzes():
    current_user=get_jwt_identity()
    user=User.query.filter_by(user_id=current_user).first()

    if not user :
        return jsonify({"error":"You aren't a registered user"}), 403
    
    quizzes=Quiz.query.all()
    quizzes_list=[
        {
            "quiz_id":quiz.quiz_id,
            "quiz_name":quiz.quiz_name,
            "quiz_topic":quiz.quiz_topic,
            "status":quiz.stat,
            "created_by":quiz.crt_by,
            "randomiz":quiz.randomiz
        } for quiz in quizzes
    ]

    return jsonify({"quizzes":quizzes_list}), 200

@auth_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    current_user=get_jwt_identity()
    user=User.query.filter_by(user_id=current_user).first()

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to perform this function"}), 403
    
    quiz=Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error":"Quiz doesn't exist"}), 404
    
    quiz_data={
        "quiz_id":quiz.quiz_id,
        "quiz_name":quiz.quiz_name,
        "quiz_topic":quiz.quiz_topic,
        "status":quiz.stat,
        "created_by":quiz.crt_by,
        "randomiz":quiz.randomiz
    }

    return jsonify({"quiz":quiz_data}), 200

@auth_bp.route('/quiz/<int:quiz_id>', methods=['OPTIONS', 'PUT', 'DELETE']) # Updated route
@cross_origin()
@jwt_required()
def update_delete_quiz(quiz_id):
    if request.method == 'OPTIONS':
        return jsonify({"message": "Options request successful"}), 200
    elif request.method == 'PUT':
        current_user=get_jwt_identity()
        user=User.query.get(current_user)

        if not user or user.rl!="admin":
            return jsonify({"error":"You aren't authorized to perform this function"}), 403
        
        quiz=Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error":"Quiz doesn't exist"}), 404
        
        data=request.get_json()

        quiz.quiz_name=data.get("quiz_name", quiz.quiz_name)
        quiz.quiz_topic=data.get("quiz_topic", quiz.quiz_topic)
        quiz.stat=data.get("status", quiz.stat)
        quiz.end_time=data.get("end_time", quiz.end_time)
        quiz.randomiz=data.get("randomiz", quiz.randomiz)

        db.session.commit()

        updated_quiz={
            "quiz_id":quiz.quiz_id,
            "quiz_name":quiz.quiz_name,
            "quiz_topic":quiz.quiz_topic,
            "status":quiz.stat,
            "created_by":quiz.crt_by,
            "randomiz":quiz.randomiz
        }

        return jsonify({'message':'Quiz updated successfully', 'quiz':updated_quiz}), 200

    elif request.method == 'DELETE':
        current_user = get_jwt_identity()
        user = User.query.get(current_user)

        if not user or user.rl != "admin":
            return jsonify({"error": "You aren't authorized to perform this function"}), 403

        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return jsonify({"error": "Quiz doesn't exist"}), 404

        # Delete associated questions and choices (cascading delete)
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
        for question in questions:
            choices = Choice.query.filter_by(ques_id=question.ques_id).all()
            for choice in choices:
                db.session.delete(choice)  # Delete choices
            db.session.delete(question)  # Delete questions

        db.session.delete(quiz)  # Delete the quiz
        db.session.commit()

        return jsonify({'message': 'Quiz successfully deleted'}), 200
@auth_bp.route('/questions', methods=['POST'])
@jwt_required()
def create_question():
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to perform this function"}), 403
    
    data=request.get_json()
    ques_id=data.get('ques_id')
    question_text=data.get('question')
    topic=data.get('topic')
    points=data.get('points')
    quiz_id=data.get('quiz_id')
    ques_time_limit=data.get('ques_time_limit')

    quiz=Quiz.query.get(quiz_id)
    
    question=Question.query.get(ques_id)
    if question:
        return jsonify({"error":"Question id already exist"}), 404

    new_question=Question(
        ques_id=ques_id,
        question=question_text,
        topic=topic,
        points=points,
        quiz_id=quiz_id,
        ques_time_limit=ques_time_limit
    )

    db.session.add(new_question)
    db.session.commit()

    return jsonify({"Message":"Question successfully added", "ques_id":new_question.ques_id}), 201

@auth_bp.route('/questions', methods=['GET'])
@jwt_required()
def get_questions():
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to perform this function"}), 403
    
    questions=Question.query.all()
    questions_list=[
        {
            "ques_id":question.ques_id,
            "question":question.question,
            "topic":question.topic,
            "points":question.points,
            "quiz_id":question.quiz_id,
            "ques_time_limit":question.ques_time_limit
        } for question in questions
    ]

    return jsonify({"questions":questions_list}), 200

@auth_bp.route('/questions/<string:ques_id>', methods=['GET'])
@jwt_required()
def get_question(ques_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to perform this function"}), 403
    
    question=Question.query.get(ques_id)
    if not question:
        return jsonify({"error":"Question doesn't exist"}), 404
    
    question_data={
        "ques_id":question.ques_id,
        "question":question.question,
        "topic":question.topic,
        "points":question.points,
        "quiz_id":question.quiz_id,
        "ques_time_limit":question.ques_time_limit
    }

    return jsonify({"Question":question_data}), 200

@auth_bp.route('/questions/<string:ques_id>', methods=['PUT'])
@jwt_required()
def update_question(ques_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to update this question"}), 403
    
    question=Question.query.get(ques_id)
    if not question:
        return jsonify({"error":"Question doesn't exist"}), 404
    
    data=request.get_json()
    question.question=data.get('question', question.question)
    question.topic=data.get('topic', question.topic)
    question.points=data.get('points', question.points)
    question.ques_time_limit=data.get('ques_time_limit', question.ques_time_limit)

    db.session.commit()

    return jsonify({"Message":"Question updated successfully"}), 200

@auth_bp.route('/questions/<string:ques_id>', methods=['DELETE'])
@jwt_required()
def delete_question(ques_id):
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error": "You aren't authorized to delete this question"}), 403
    
    question = Question.query.get(ques_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    db.session.delete(question)
    db.session.commit()

    return jsonify({"message": "Question deleted successfully"}), 200

@auth_bp.route('/choices', methods=['POST'])
@jwt_required()
def add_choice():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error": "You aren't authorized to add a choice"}), 403
    
    data = request.get_json()
    ques_id = data.get('ques_id')
    ch_text = data.get('ch_text')
    is_correct = data.get('is_correct')

    question = Question.query.get(ques_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    choice_id = str(uuid.uuid4())
    new_choice = Choice(
        choice_id=choice_id,
        ques_id=ques_id,
        ch_text=ch_text,
        is_correct=is_correct
    )
    
    db.session.add(new_choice)
    db.session.commit()

    return jsonify({'message': 'Choice added successfully', 'choice_id': new_choice.choice_id}), 201

@auth_bp.route('/choices/<string:ques_id>', methods=['GET'])
@jwt_required()
def get_choices(ques_id):
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error": "You aren't authorized to view the choices"}), 403
    
    question = Question.query.get(ques_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    choices=Choice.query.filter_by(ques_id=question.ques_id).all()
    choices_list=[
        {
            "choice_id":choice.choice_id,
            "ch_text":choice.ch_text,
            "is_correct":choice.is_correct
        } for choice in choices
    ]

    return jsonify({"Choices":choices_list}), 200

@auth_bp.route('/choices/<string:choice_id>', methods=['PUT'])
@jwt_required()
def update_choice(choice_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to update the choice"}), 403
    
    choice=Choice.query.get(choice_id)
    if not choice:
        return jsonify({"error":"Choice doesn't exist"}), 404
    
    data=request.get_json()
    choice.ch_text=data.get("ch_text", choice.ch_text)
    choice.is_correct=data.get("is_correct", choice.is_correct)

    db.session.commit()

    return jsonify({"Message":"Choice successfully updated"}), 200

@auth_bp.route('/choices/<string:choice_id>', methods=['DELETE'])
@jwt_required()
def delete_choice(choice_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to delete this choice"}), 403
    
    choice=Choice.query.get(choice_id)
    if not choice:
        return jsonify({"error":"Choice doesn't exist"}), 404
    
    db.session.delete(choice)
    db.session.commit()

    return jsonify({"Message":"Choice successfully deleted"})

@auth_bp.route('/quiz/<int:quiz_id>/questions', methods=['GET'])
@jwt_required()
def get_quiz_questions(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    if not questions:
        return jsonify({"message": "No questions found for this quiz"}), 200

    quiz_data=[]
    for ques in questions:
        choices=Choice.query.filter_by(ques_id=ques.ques_id).all()
        choices_list=[
            {
                "choice_id":choice.choice_id,
                "ch_text":choice.ch_text,
                "is_correct":choice.is_correct
            }for choice in choices
        ]
        quiz_data.append(
            {
                "ques_id":ques.ques_id,
                "question":ques.question,
                "points":ques.points,
                "ques_time_limit":ques.ques_time_limit,
                "choices":choices_list
            }
        )
    
    return jsonify({"quiz_id":quiz_id, "questions:":quiz_data}), 200

@auth_bp.route('/submit_quiz', methods=['POST'])
@jwt_required()
def submit_quiz():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data=request.get_json()
    quiz_id=data.get("quiz_id")
    answers=data.get("answers")  # Expecting a list of {ques_id, selected_choice_id}

    quiz=Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error":"Quiz not found"}), 404

    total_score=0
    total_time=0

    for ans in answers:
        ques_id=ans.get("ques_id")
        selected_choice_id=ans.get("selected_choice_id")

        question=Question.query.get(ques_id)
        if not question:
            return jsonify({"error":"Question not found"}), 404
        
        choice=Choice.query.filter_by(choice_id=selected_choice_id, ques_id=ques_id).first()
        if not choice:
            return jsonify({"error":f"Invalid choice for question {ques_id}"}), 400
        
        if choice.is_correct:
            total_score+=question.points
        
        total_time+=question.ques_time_limit

    result_id=str(uuid.uuid4())

    new_result=Result(
        result_id=result_id,
        user_id=current_user,
        user_name=user.user_name,
        quiz_id=quiz_id,
        score=total_score,
        time_taken=total_time
    )

    db.session.add(new_result)
    db.session.commit()

    return jsonify({"message":"Quiz successfully submitted", "score":total_score, "time_taken":total_time}), 201

@auth_bp.route('/results/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_results(quiz_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)
    if not user:
        return jsonify({"error":"User not found"}), 403
    
    quiz=Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error":"Quiz not found"}), 404
    
    result=Result.query.filter_by(quiz_id=quiz_id, user_id=current_user).first()
    if not result:
        return jsonify({"error":"Result not found"}), 404
    
    result_data={
        "quiz_id":result.quiz_id,
        "user_id":result.user_id,
        "user_name":result.user_name,
        "score":result.score,
        "time_taken":result.time_taken
    }

    return jsonify({"result":result_data}), 200

@auth_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized the use the dashboard"}), 403
    
    quizzes=Quiz.query.all()
    quiz_data=[
        {
            "quiz_id":quiz.quiz_id,
            "quiz_name":quiz.quiz_name,
            "num_questions":len(Question.query.filter_by(quiz_id=quiz.quiz_id).all()),
            "num_players":len(Result.query.filter_by(quiz_id=quiz.quiz_id).all())
        } for quiz in quizzes
    ]

    questions=Question.query.all()
    question_data=[
        {
            "ques_id":ques.ques_id,
            "question":ques.question,
            "quiz_id":ques.quiz_id,
            "points":ques.points,
            "time_limit":ques.ques_time_limit
        } for ques in questions
    ]

    results=Result.query.all()
    result_data=[
        {
            "user_name":result.user_name,
            "quiz_id":result.quiz_id,
            "score":result.score,
            "time_taken":result.time_taken
        } for result in results
    ]

    players=User.query.filter_by(rl="player").all()
    player_data=[
        {
            "user_id":player.user_id,
            "user_name":player.user_name,
            "num_quiz_attempts":len(Result.query.filter_by(user_id=player.user_id).all())
        } for player in players
    ]

    total_users = User.query.count()

    # Count the number of quizzes
    total_quizzes = Quiz.query.count()

    # Count the number of questions
    total_questions = Question.query.count()

    # Count the number of results (or submissions)
    total_results = Result.query.count()

    # Calculate average points per quiz
    avg_points_per_quiz = db.session.query(func.avg(Quiz.total_points)).scalar()

    # Calculate average time taken per quiz (in seconds)
    avg_time_taken_per_quiz = db.session.query(func.avg(Result.time_taken)).scalar()

    return jsonify({
        "quizzes":quiz_data,
        "questions":question_data,
        "results":result_data,
        "players":player_data,
        "total_users": total_users,
        "total_quizzes": total_quizzes,
        "total_questions": total_questions,
        "total_results": total_results,
        "avg_points_per_quiz": avg_points_per_quiz,
        "avg_time_taken_per_quiz": avg_time_taken_per_quiz
    }), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error": "You aren't authorized to view users"}), 403

    users = User.query.all()
    users_list = [
        {
            "user_id": u.user_id,
            "user_name": u.user_name,
            "email": u.email,
            "role": u.rl
        } for u in users
    ]

    return jsonify({"users": users_list}), 200

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    current_user=get_jwt_identity()
    user=User.query.get(current_user)

    if not user or user.rl!="admin":
        return jsonify({"error":"You aren't authorized to change the roles"}), 403
    
    user_to_update=User.query.get(user_id)
    if not user_to_update:
        return jsonify({"error":"User not found"}), 404
    
    data=request.get_json()
    new_role=data.get("role")
    if new_role not in ["admin","player"]:
        return jsonify({"error":"Invalid role"}), 400
    
    user_to_update.rl=new_role
    db.session.commit()

    return jsonify({"Message":"User's role updated"}), 200

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or user.rl != "admin":
        return jsonify({"error": "You aren't authorized to delete this user"}), 403

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"error": "User not found"}), 404
    
    db.session.delete(user_to_delete)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200


@auth_bp.route('/quiz/<int:quiz_id>/leaderboard')
@jwt_required()
def get_leaderboard(quiz_id):
    quiz=Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error":"Quiz not found"}), 404
    
    leaderboard=db.session.query(
        Result.user_id,
        Result.user_name,
        Result.score
    ).filter_by(quiz_id=quiz_id).order_by(Result.score.desc()).limit(10).all()

    if not leaderboard:
        return jsonify({"Message":"No submissions found for this quiz"}), 200
    
    leaderboard_data=[
        {
            "rank":idx+1,
            "User_name":entry.user_name,
            "Score":entry.score
        } for idx,entry in enumerate(leaderboard)
    ]

    return jsonify({"quiz_id":quiz_id, "leaderboard":leaderboard_data}), 200

