from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt

db=SQLAlchemy()
jwt=JWTManager()
migrate=Migrate()
bcrypt=Bcrypt()

def create_app():
    app=Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app,db)
    bcrypt.init_app(app)
    CORS(app)#Helps backend in communicating with the frontend

    from .routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app
