#!/usr/bin/env python3

import sys
import os

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from datetime import datetime, date, timedelta
import random
from src.models.user import User, db
from src.models.application import Application
from src.models.application_history import ApplicationHistory
from src.models.pf_continue_data import PFContinueData
from flask import Flask

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'
db.init_app(app)

def create_sample_data():
    print("Creating sample data...")
    
    # Create all database tables
    db.create_all()
    print("Database tables created.")
    
    # Create sample officers
    officers = []
    officer_data = [
        ('john_doe', 'john.doe@company.com', 'EMP001', 'Operations'),
        ('jane_smith', 'jane.smith@company.com', 'EMP002', 'Customer Service'),
        ('mike_wilson', 'mike.wilson@company.com', 'EMP003', 'Operations'),
        ('sarah_johnson', 'sarah.johnson@company.com', 'EMP004', 'Quality Control'),
    ]
    
    for username, email, emp_id, dept in officer_data:
        if not User.query.filter_by(username=username).first():
            officer = User(
                username=username,
                email=email,
                role='OFFICER',
                employee_id=emp_id,
                department=dept,
                phone_number=f'+1-555-{random.randint(1000, 9999)}'
            )
            officer.set_password('password123')
            db.session.add(officer)
            officers.append(officer)
    
    # Create a viewer
    if not User.query.filter_by(username='viewer').first():
        viewer = User(
            username='viewer',
            email='viewer@company.com',
            role='VIEWER',
            employee_id='VIEW001',
            department='Management'
        )
        viewer.set_password('viewer123')
        db.session.add(viewer)
    
    db.session.commit()
    
    # Create admin user if not exists
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            email='admin@company.com',
            role='ADMIN',
            employee_id='ADMIN001',
            department='IT'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
    
    # Get all officers for assignment
    all_officers = User.query.filter_by(role='OFFICER').all()
    admin_user = User.query.filter_by(role='ADMIN').first()
    
    # Create sample applications
    branches = ['947', '419', '990', '2871', '1234', '5678', '9012']
    card_types = ['CLASSIC', 'GOLD', 'PLATINUM']
    card_positions = ['MAIN', 'SUPPLE']
    statuses = ['UNTOUCH', 'PENDING', 'HOLD', 'DONE']
    
    customer_names = [
        'John Anderson', 'Mary Johnson', 'Robert Brown', 'Patricia Davis',
        'Michael Wilson', 'Linda Miller', 'William Moore', 'Elizabeth Taylor',
        'David Anderson', 'Jennifer White', 'Richard Harris', 'Maria Garcia',
        'Charles Martin', 'Susan Thompson', 'Joseph Jackson', 'Margaret Lee',
        'Thomas Clark', 'Dorothy Lewis', 'Christopher Walker', 'Lisa Hall'
    ]
    
    applications = []
    for i in range(100):
        app_date = date.today() - timedelta(days=random.randint(0, 30))
        
        application = Application(
            date=app_date,
            branch_code=random.choice(branches),
            app_id=f"APP{20000 + i:05d}",
            name=random.choice(customer_names),
            card=random.choice(card_positions),
            type=random.choice(card_types),
            status=random.choice(statuses),
            remarks=f"Sample remarks for application {i+1}" if random.random() > 0.7 else None,
            assigned_to_id=random.choice(all_officers).id if random.random() > 0.3 else None,
            work_on=f"Work item {i+1}" if random.random() > 0.8 else None,
            inform_to=f"Contact {random.choice(['Manager', 'Supervisor', 'Team Lead'])}" if random.random() > 0.9 else None,
            ipt=f"IPT{random.randint(100, 999)}" if random.random() > 0.8 else None,
            pf_continue_matched=random.random() > 0.4,
            created_by_id=admin_user.id,
            created_at=datetime.now() - timedelta(days=random.randint(0, 30)),
            updated_at=datetime.now() - timedelta(days=random.randint(0, 5))
        )
        
        db.session.add(application)
        applications.append(application)
    
    db.session.commit()
    
    print("Sample data created successfully!")
    print(f"Created {len(all_officers)} officers")
    print(f"Created {len(applications)} applications")
    print("\nLogin credentials:")
    print("Admin: username=admin, password=admin123")
    print("Viewer: username=viewer, password=viewer123")
    print("Officers: username=john_doe/jane_smith/mike_wilson/sarah_johnson, password=password123")

if __name__ == '__main__':
    with app.app_context():
        create_sample_data()

