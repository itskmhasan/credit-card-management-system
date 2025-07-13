from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from src.models.user import db

class ApplicationHistory(db.Model):
    __tablename__ = 'application_history'
    
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('ASSIGN', 'Assigned'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('REMARK_ADDED', 'Remark Added'),
    ]
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign keys
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    changed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Action details
    action = db.Column(db.String(20), nullable=False)
    old_value = db.Column(db.Text)  # JSON string
    new_value = db.Column(db.Text)  # JSON string
    remarks = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    application = db.relationship('Application', backref='history')
    changed_by = db.relationship('User', backref='history_changes')
    
    def __repr__(self):
        return f'<ApplicationHistory {self.application_id}: {self.action}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'application_id': self.application_id,
            'action': self.action,
            'old_value': json.loads(self.old_value) if self.old_value else None,
            'new_value': json.loads(self.new_value) if self.new_value else None,
            'remarks': self.remarks,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'changed_by_id': self.changed_by_id,
            'changed_by': self.changed_by.to_dict() if self.changed_by else None
        }
    
    @classmethod
    def create_history_entry(cls, application_id, action, old_value=None, new_value=None, changed_by_id=None, remarks=None):
        """Helper method to create history entries"""
        history = cls(
            application_id=application_id,
            action=action,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            changed_by_id=changed_by_id,
            remarks=remarks
        )
        db.session.add(history)
        return history

