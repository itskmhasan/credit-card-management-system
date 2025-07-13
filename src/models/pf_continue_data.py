from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from src.models.user import db

class PFContinueData(db.Model):
    __tablename__ = 'pf_continue_data'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Core data
    app_id = db.Column(db.String(20), nullable=False)
    customer_name = db.Column(db.String(255), nullable=False)
    branch_code = db.Column(db.String(10), nullable=False)
    upload_date = db.Column(db.Date, nullable=False)
    additional_data = db.Column(db.Text)  # JSON string for flexible data storage
    
    # Audit fields
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_by = db.relationship('User', backref='pf_continue_uploads')
    
    def __repr__(self):
        return f'<PFContinueData {self.app_id}: {self.customer_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'app_id': self.app_id,
            'customer_name': self.customer_name,
            'branch_code': self.branch_code,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'additional_data': json.loads(self.additional_data) if self.additional_data else None,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_by': self.uploaded_by.to_dict() if self.uploaded_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def set_additional_data(self, data):
        """Helper method to set additional data as JSON"""
        self.additional_data = json.dumps(data) if data else None
    
    def get_additional_data(self):
        """Helper method to get additional data from JSON"""
        return json.loads(self.additional_data) if self.additional_data else None

