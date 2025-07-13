from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.application import Application
from src.models.pf_continue_data import PFContinueData
from src.models.application_history import ApplicationHistory
from src.routes.auth import login_required, admin_required, get_current_user
from datetime import datetime, date
import pandas as pd

pfcontinue_bp = Blueprint('pfcontinue', __name__)

@pfcontinue_bp.route('/pfcontinue/upload', methods=['POST'])
@admin_required
def upload_pfcontinue_data():
    """Upload PFContinue data from Excel file"""
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
        
        # Expected columns (flexible mapping)
        required_columns = ['App ID', 'Name']  # Minimum required columns
        
        # Check if required columns exist
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({'error': f'Missing required columns: {missing_columns}'}), 400
        
        created_count = 0
        errors = []
        current_user = get_current_user()
        upload_date = date.today()
        
        for index, row in df.iterrows():
            try:
                # Extract basic data
                app_id = str(row['App ID']) if pd.notna(row['App ID']) else None
                customer_name = str(row['Name']) if pd.notna(row['Name']) else None
                
                if not app_id or not customer_name:
                    errors.append(f"Row {index + 1}: App ID and Name are required")
                    continue
                
                # Extract branch code if available
                branch_code = str(row['Br Code']) if 'Br Code' in df.columns and pd.notna(row['Br Code']) else ''
                
                # Store additional data as JSON
                additional_data = {}
                for col in df.columns:
                    if col not in ['App ID', 'Name', 'Br Code'] and pd.notna(row[col]):
                        additional_data[col] = str(row[col])
                
                # Check if record already exists
                existing = PFContinueData.query.filter_by(
                    app_id=app_id,
                    upload_date=upload_date
                ).first()
                
                if existing:
                    errors.append(f"Row {index + 1}: Record for App ID {app_id} already exists for today")
                    continue
                
                # Create new PFContinue record
                pf_data = PFContinueData(
                    app_id=app_id,
                    customer_name=customer_name,
                    branch_code=branch_code,
                    upload_date=upload_date,
                    uploaded_by_id=current_user.id
                )
                pf_data.set_additional_data(additional_data)
                
                db.session.add(pf_data)
                created_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully uploaded {created_count} PFContinue records',
            'created_count': created_count,
            'errors': errors
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pfcontinue_bp.route('/pfcontinue', methods=['GET'])
@login_required
def get_pfcontinue_data():
    """Get PFContinue data with filtering"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        upload_date = request.args.get('upload_date')
        app_id = request.args.get('app_id')
        
        # Base query
        query = PFContinueData.query
        
        # Apply filters
        if upload_date:
            query = query.filter(PFContinueData.upload_date == upload_date)
        if app_id:
            query = query.filter(PFContinueData.app_id.like(f'%{app_id}%'))
        
        # Pagination
        pf_data = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'pf_continue_data': [data.to_dict() for data in pf_data.items],
            'total': pf_data.total,
            'pages': pf_data.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pfcontinue_bp.route('/pfcontinue/cross-check', methods=['POST'])
@admin_required
def cross_check_applications():
    """Perform cross-check between applications and PFContinue data"""
    try:
        data = request.get_json()
        upload_date = data.get('upload_date', date.today().isoformat())
        
        # Parse upload date
        check_date = datetime.strptime(upload_date, '%Y-%m-%d').date()
        
        # Get PFContinue data for the specified date
        pf_data = PFContinueData.query.filter_by(upload_date=check_date).all()
        
        if not pf_data:
            return jsonify({'error': 'No PFContinue data found for the specified date'}), 404
        
        # Create lookup dictionary
        pf_lookup = {data.app_id: data for data in pf_data}
        
        # Get all applications
        applications = Application.query.all()
        
        matched_count = 0
        unmatched_applications = []
        unmatched_pf_data = []
        current_user = get_current_user()
        
        # Check applications against PFContinue data
        for app in applications:
            if app.app_id in pf_lookup:
                # Match found
                if not app.pf_continue_matched:
                    app.pf_continue_matched = True
                    
                    # Create history entry
                    ApplicationHistory.create_history_entry(
                        application_id=app.id,
                        action='UPDATE',
                        old_value={'pf_continue_matched': False},
                        new_value={'pf_continue_matched': True},
                        changed_by_id=current_user.id,
                        remarks='Matched with PFContinue data'
                    )
                    
                    matched_count += 1
                
                # Remove from lookup to track unmatched PF data
                del pf_lookup[app.app_id]
            else:
                # No match found
                unmatched_applications.append({
                    'app_id': app.app_id,
                    'name': app.name,
                    'branch_code': app.branch_code,
                    'type': app.type,
                    'status': app.status
                })
        
        # Remaining items in pf_lookup are unmatched PF data
        for pf_app_id, pf_record in pf_lookup.items():
            unmatched_pf_data.append({
                'app_id': pf_record.app_id,
                'customer_name': pf_record.customer_name,
                'branch_code': pf_record.branch_code
            })
        
        db.session.commit()
        
        return jsonify({
            'message': f'Cross-check completed. {matched_count} new matches found.',
            'matched_count': matched_count,
            'unmatched_applications': unmatched_applications,
            'unmatched_pf_data': unmatched_pf_data,
            'total_applications': len(applications),
            'total_pf_records': len(pf_data)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pfcontinue_bp.route('/applications/unmatched', methods=['GET'])
@login_required
def get_unmatched_applications():
    """Get applications that don't have PFContinue matches"""
    try:
        current_user = get_current_user()
        
        # Base query for unmatched applications
        query = Application.query.filter_by(pf_continue_matched=False)
        
        # Role-based filtering
        if current_user.is_officer():
            query = query.filter(Application.assigned_to_id == current_user.id)
        
        applications = query.all()
        
        return jsonify({
            'unmatched_applications': [app.to_dict() for app in applications]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pfcontinue_bp.route('/applications/<int:app_id>/match-status', methods=['PUT'])
@login_required
def update_match_status(app_id):
    """Manually update PFContinue match status"""
    try:
        current_user = get_current_user()
        application = Application.query.get_or_404(app_id)
        
        # Check permissions
        if current_user.is_officer() and application.assigned_to_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        if current_user.is_viewer():
            return jsonify({'error': 'Viewers cannot modify applications'}), 403
        
        data = request.get_json()
        matched = data.get('matched', False)
        remarks = data.get('remarks', '')
        
        old_matched = application.pf_continue_matched
        application.pf_continue_matched = matched
        application.pf_continue_remarks = remarks
        
        # Create history entry
        ApplicationHistory.create_history_entry(
            application_id=application.id,
            action='UPDATE',
            old_value={
                'pf_continue_matched': old_matched,
                'pf_continue_remarks': application.pf_continue_remarks
            },
            new_value={
                'pf_continue_matched': matched,
                'pf_continue_remarks': remarks
            },
            changed_by_id=current_user.id,
            remarks='Manual PFContinue match status update'
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Match status updated successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pfcontinue_bp.route('/pfcontinue/summary', methods=['GET'])
@login_required
def get_cross_check_summary():
    """Get summary of cross-check results"""
    try:
        upload_date = request.args.get('upload_date', date.today().isoformat())
        check_date = datetime.strptime(upload_date, '%Y-%m-%d').date()
        
        # Get counts
        total_applications = Application.query.count()
        matched_applications = Application.query.filter_by(pf_continue_matched=True).count()
        unmatched_applications = total_applications - matched_applications
        
        total_pf_records = PFContinueData.query.filter_by(upload_date=check_date).count()
        
        return jsonify({
            'summary': {
                'total_applications': total_applications,
                'matched_applications': matched_applications,
                'unmatched_applications': unmatched_applications,
                'total_pf_records': total_pf_records,
                'match_percentage': round((matched_applications / total_applications * 100), 2) if total_applications > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

