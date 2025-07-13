from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Application(db.Model):
    __tablename__ = 'applications'
    
    CARD_CHOICES = [
        ('MAIN', 'Main Card'),
        ('SUPPLE', 'Supplementary Card'),
    ]
    
    TYPE_CHOICES = [
        ('CLASSIC', 'Classic'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    ]
    
    STATUS_CHOICES = [
        ('UNTOUCH', 'Untouched'),
        ('PENDING', 'Pending'),
        ('HOLD', 'Hold'),
        ('DONE', 'Done'),
    ]
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Core application data
    date = db.Column(db.Date, nullable=False)
    branch_code = db.Column(db.String(10), nullable=False)
    app_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    card = db.Column(db.String(10), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    
    # Processing information
    status = db.Column(db.String(10), default='UNTOUCH', nullable=False)
    remarks = db.Column(db.Text)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Additional tracking fields
    work_on = db.Column(db.String(100))
    inform_to = db.Column(db.String(100))
    ipt = db.Column(db.String(50))
    
    # Cross-check information
    pf_continue_matched = db.Column(db.Boolean, default=False)
    pf_continue_remarks = db.Column(db.Text)
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Relationships
    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id], backref='assigned_applications')
    created_by = db.relationship('User', foreign_keys=[created_by_id], backref='created_applications')
    
    def __repr__(self):
        return f'<Application {self.app_id}: {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'branch_code': self.branch_code,
            'app_id': self.app_id,
            'name': self.name,
            'card': self.card,
            'type': self.type,
            'status': self.status,
            'remarks': self.remarks,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to': self.assigned_to.to_dict() if self.assigned_to else None,
            'work_on': self.work_on,
            'inform_to': self.inform_to,
            'ipt': self.ipt,
            'pf_continue_matched': self.pf_continue_matched,
            'pf_continue_remarks': self.pf_continue_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by_id': self.created_by_id,
            'created_by': self.created_by.to_dict() if self.created_by else None
        }
    
    @classmethod
    def get_status_choices(cls):
        return [choice[0] for choice in cls.STATUS_CHOICES]
    
    @classmethod
    def get_card_choices(cls):
        return [choice[0] for choice in cls.CARD_CHOICES]
    
    @classmethod
    def get_type_choices(cls):
        return [choice[0] for choice in cls.TYPE_CHOICES]

