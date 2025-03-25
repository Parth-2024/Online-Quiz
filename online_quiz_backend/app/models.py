from . import db #Have to use the SQLAlchemy object which is created in __init__.py file
import datetime

class User(db.Model):
    __tablename__ = 'Users'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_name = db.Column(db.String(100), nullable=False)
    rl = db.Column(db.Enum("admin", "player"), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Quiz(db.Model):
    __tablename__ = 'Quiz'
    
    quiz_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    quiz_name = db.Column(db.String(100), nullable=False)
    quiz_topic = db.Column(db.String(100), nullable=False)
    total_points = db.Column(db.Integer, default=0)
    avg_score = db.Column(db.Float)
    winner_id = db.Column(db.Integer, db.ForeignKey('Users.user_id', ondelete="SET NULL"), nullable=True)
    crt_by = db.Column(db.Integer, db.ForeignKey('Users.user_id', ondelete="CASCADE"), nullable=False)
    str_time = db.Column(db.DateTime, default=db.func.current_timestamp())
    end_time = db.Column(db.DateTime, nullable=False)
    stat = db.Column(db.Enum("Active", "Completed", "Archived"), default="Active", nullable=False)
    randomiz = db.Column(db.Integer, nullable=False)
    
    winner = db.relationship('User', foreign_keys=[winner_id], backref='won_quizzes')
    creator = db.relationship('User', foreign_keys=[crt_by], backref='created_quizzes')


#Here’s a concise summary of the difference between `db.ForeignKey()` and `db.relationship()`:
# - **`db.ForeignKey()`**: 
#    - Defines the **foreign key constraint** in the database.
#    - Ensures referential integrity (e.g., a `quiz` must have a valid `user_id` from the `Users` table).
#    - Used in the column definition to link one table to another.

# - **`db.relationship()`**: 
#    - Defines the **relationship** between tables at the **ORM** level (i.e., how Python objects are related).
#    - Makes it easier to query and navigate relationships between tables without writing raw SQL.
#    - Helps you access related data (like fetching all quizzes created by a user).

# ### Example:
# - `db.ForeignKey()` ensures that the database enforces a valid reference (i.e., `quiz.crt_by` refers to a valid `user.id`).
# - `db.relationship()` makes it easy to access all quizzes created by a user with `user.quizzes`.

# They work together to maintain data integrity (foreign key) and provide an easy way to work with related data (relationship).

class UserLog(db.Model):
    __tablename__ = 'User_logs'
    
    log_no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    time_stamp = db.Column(db.DateTime, default=db.func.current_timestamp())
    acts = db.Column(db.String(200), nullable=False)
    
    user = db.relationship('User', backref='logs')

class Question(db.Model):
    __tablename__ = 'questions'
    
    ques_id = db.Column(db.String(50), primary_key=True)
    question = db.Column(db.Text, nullable=False)
    topic = db.Column(db.String(50), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('Quiz.quiz_id'), nullable=False)
    ques_time_limit = db.Column(db.Integer, nullable=False)
    
    quiz = db.relationship('Quiz', backref='questions')

class Choice(db.Model):
    __tablename__ = 'choice'
    
    choice_id = db.Column(db.String(50), primary_key=True)
    ques_id = db.Column(db.String(50), db.ForeignKey('questions.ques_id'), nullable=False)
    ch_text = db.Column(db.String(200), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    
    question = db.relationship('Question', backref='choices')

class Result(db.Model):
    __tablename__ = "results"

    result_id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("Users.user_id"), nullable=False)
    user_name=db.Column(db.String(100), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("Quiz.quiz_id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    time_taken = db.Column(db.Integer, nullable=False)

    user = db.relationship("User", backref="results")
    quiz = db.relationship("Quiz", backref="results")
