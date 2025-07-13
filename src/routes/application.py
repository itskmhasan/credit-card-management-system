from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.application import Application
from src.models.application_history import ApplicationHistory
from src.routes.auth import login_required, admin_required, get_current_user
from datetime import datetime, date
import pandas as pd
import io

application_bp = Blueprint('application', __name__)

@application_bp.route('/applications', methods=['GET'])
@login_required
def get_applications():
    """Get applications with filtering and pagination"""
    try:
        current_user = get_current_user()
        
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        card_type = request.args.get('type')
        branch_code = request.args.get('branch_code')
        assigned_to = request.args.get('assigned_to')
        
        # Base query
        query = Application.query
        
        # Role-based filtering
        if current_user.is_officer():
            # Officers can only see their assigned applications
            query = query.filter(Application.assigned_to_id == current_user.id)
        
        # Apply filters
        if status:
            query = query.filter(Application.status == status)
        if card_type:
            query = query.filter(Application.type == card_type)
        if branch_code:
            query = query.filter(Application.branch_code == branch_code)
        if assigned_to and (current_user.is_admin() or current_user.is_viewer()):
            query = query.filter(Application.assigned_to_id == assigned_to)
        
        # Pagination
        applications = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'applications': [app.to_dict() for app in applications.items],
            'total': applications.total,
            'pages': applications.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/<int:app_id>', methods=['GET'])
@login_required
def get_application(app_id):
    """Get single application by ID"""
    try:
        current_user = get_current_user()
        application = Application.query.get_or_404(app_id)
        
        # Check permissions
        if current_user.is_officer() and application.assigned_to_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'application': application.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/<int:app_id>', methods=['PUT'])
@login_required
def update_application(app_id):
    """Update application"""
    try:
        current_user = get_current_user()
        application = Application.query.get_or_404(app_id)
        
        # Check permissions
        if current_user.is_officer() and application.assigned_to_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        if current_user.is_viewer():
            return jsonify({'error': 'Viewers cannot modify applications'}), 403
        
        data = request.get_json()
        old_values = {}
        new_values = {}
        
        # Track changes for audit
        updatable_fields = ['status', 'remarks', 'work_on', 'inform_to', 'ipt', 'pf_continue_remarks']
        
        for field in updatable_fields:
            if field in data:
                old_values[field] = getattr(application, field)
                setattr(application, field, data[field])
                new_values[field] = data[field]
        
        # Special handling for assignment (admin only)
        if 'assigned_to_id' in data and current_user.is_admin():
            old_values['assigned_to_id'] = application.assigned_to_id
            application.assigned_to_id = data['assigned_to_id']
            new_values['assigned_to_id'] = data['assigned_to_id']
        
        # Create history entry
        if old_values:
            action = 'STATUS_CHANGE' if 'status' in old_values else 'UPDATE'
            ApplicationHistory.create_history_entry(
                application_id=application.id,
                action=action,
                old_value=old_values,
                new_value=new_values,
                changed_by_id=current_user.id
            )
        
        db.session.commit()
        return jsonify({
            'message': 'Application updated successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/<int:app_id>/assign', methods=['PUT'])
@admin_required
def assign_application(app_id):
    """Assign application to officer"""
    try:
        application = Application.query.get_or_404(app_id)
        data = request.get_json()
        officer_id = data.get('officer_id')
        
        if not officer_id:
            return jsonify({'error': 'Officer ID required'}), 400
        
        # Verify officer exists and has correct role
        officer = User.query.get(officer_id)
        if not officer or not officer.is_officer():
            return jsonify({'error': 'Invalid officer'}), 400
        
        old_assigned = application.assigned_to_id
        application.assigned_to_id = officer_id
        
        # Create history entry
        ApplicationHistory.create_history_entry(
            application_id=application.id,
            action='ASSIGN',
            old_value={'assigned_to_id': old_assigned},
            new_value={'assigned_to_id': officer_id},
            changed_by_id=get_current_user().id
        )
        
        db.session.commit()
        return jsonify({
            'message': 'Application assigned successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/<int:app_id>/history', methods=['GET'])
@login_required
def get_application_history(app_id):
    """Get application history"""
    try:
        current_user = get_current_user()
        application = Application.query.get_or_404(app_id)
        
        # Check permissions
        if current_user.is_officer() and application.assigned_to_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        history = ApplicationHistory.query.filter_by(application_id=app_id).order_by(
            ApplicationHistory.timestamp.desc()
        ).all()
        
        return jsonify({
            'history': [entry.to_dict() for entry in history]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/bulk-upload', methods=['POST'])
@admin_required
def bulk_upload_applications():
    """Bulk upload applications from Excel file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({'error': 'Only Excel files are supported'}), 400
        
        # Read Excel file
        df = pd.read_excel(file)
        
        # Expected columns mapping
        column_mapping = {
            'DATE': 'date',
            'Br Code': 'branch_code',
            'App ID': 'app_id',
            'Name': 'name',
            'Card': 'card',
            'Type': 'type',
            'Remarks': 'remarks',
            'Work On': 'work_on',
            'Inform To': 'inform_to',
            'IPT': 'ipt'
        }
        
        created_count = 0
        errors = []
        current_user = get_current_user()
        
        for index, row in df.iterrows():
            try:
                # Parse date
                app_date = pd.to_datetime(row['DATE']).date() if pd.notna(row['DATE']) else date.today()
                
                # Check if application already exists
                existing = Application.query.filter_by(app_id=str(row['App ID'])).first()
                if existing:
                    errors.append(f"Row {index + 1}: Application {row['App ID']} already exists")
                    continue
                
                # Create new application
                application = Application(
                    date=app_date,
                    branch_code=str(row['Br Code']),
                    app_id=str(row['App ID']),
                    name=str(row['Name']),
                    card=str(row['Card']).upper(),
                    type=str(row['Type']).upper(),
                    remarks=str(row['Remarks']) if pd.notna(row['Remarks']) else None,
                    work_on=str(row['Work On']) if pd.notna(row['Work On']) else None,
                    inform_to=str(row['Inform To']) if pd.notna(row['Inform To']) else None,
                    ipt=str(row['IPT']) if pd.notna(row['IPT']) else None,
                    created_by_id=current_user.id
                )
                
                db.session.add(application)
                
                # Create history entry
                ApplicationHistory.create_history_entry(
                    application_id=application.id,
                    action='CREATE',
                    new_value=application.to_dict(),
                    changed_by_id=current_user.id
                )
                
                created_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully created {created_count} applications',
            'created_count': created_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/assigned', methods=['GET'])
@login_required
def get_assigned_applications():
    """Get applications assigned to current user"""
    try:
        current_user = get_current_user()
        
        if not current_user.is_officer():
            return jsonify({'error': 'Only officers can view assigned applications'}), 403
        
        applications = Application.query.filter_by(assigned_to_id=current_user.id).all()
        
        return jsonify({
            'applications': [app.to_dict() for app in applications]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application_bp.route('/applications/choices', methods=['GET'])
@login_required
def get_application_choices():
    """Get available choices for application fields"""
    try:
        return jsonify({
            'status_choices': Application.get_status_choices(),
            'card_choices': Application.get_card_choices(),
            'type_choices': Application.get_type_choices()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

