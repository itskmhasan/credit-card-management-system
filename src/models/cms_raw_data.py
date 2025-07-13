from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class CMSRawData(db.Model):
    __tablename__ = 'cms_raw_data'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Core data
    raw_content = db.Column(db.Text, nullable=False)
    upload_date = db.Column(db.Date, nullable=False)
    processed = db.Column(db.Boolean, default=False)
    
    # Audit fields
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    uploaded_by = db.relationship('User', backref='cms_uploads')
    
    def __repr__(self):
        return f'<CMSRawData {self.id}: {self.upload_date}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'raw_content': self.raw_content,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'processed': self.processed,
            'uploaded_by_id': self.uploaded_by_id,
            'uploaded_by': self.uploaded_by.to_dict() if self.uploaded_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

