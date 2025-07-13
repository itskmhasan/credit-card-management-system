from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('OFFICER', 'Officer'),
        ('VIEWER', 'Viewer'),
    ]
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role-based access control
    role = db.Column(db.String(10), default='OFFICER', nullable=False)
    employee_id = db.Column(db.String(20), unique=True)
    department = db.Column(db.String(100))
    phone_number = db.Column(db.String(15))
    
    # Status fields
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'employee_id': self.employee_id,
            'department': self.department,
            'phone_number': self.phone_number,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'ADMIN'
    
    def is_officer(self):
        """Check if user is officer"""
        return self.role == 'OFFICER'
    
    def is_viewer(self):
        """Check if user is viewer"""
        return self.role == 'VIEWER'
    
    @classmethod
    def get_role_choices(cls):
        return [choice[0] for choice in cls.ROLE_CHOICES]
