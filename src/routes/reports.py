from flask import Blueprint, request, jsonify, send_file
from src.models.user import db
from src.models.application import Application
from src.models.application_history import ApplicationHistory
from src.routes.auth import login_required, get_current_user
from datetime import datetime, date, timedelta
from sqlalchemy import func, and_
import pandas as pd
import io
from collections import defaultdict

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/dashboard', methods=['GET'])
@login_required
def get_dashboard_metrics():
    """Get dashboard metrics and summary data"""
    try:
        current_user = get_current_user()
        
        # Base query
        base_query = Application.query
        
        # Role-based filtering
        if current_user.is_officer():
            base_query = base_query.filter(Application.assigned_to_id == current_user.id)
        
        # Today's metrics
        today = date.today()
        today_query = base_query.filter(Application.date == today)
        
        # Status counts
        status_counts = {}
        for status in Application.get_status_choices():
            count = base_query.filter(Application.status == status).count()
            status_counts[status] = count
        
        # Card type counts
        type_counts = {}
        for card_type in Application.get_type_choices():
            count = base_query.filter(Application.type == card_type).count()
            type_counts[card_type] = count
        
        # Branch-wise counts (top 10)
        branch_counts = db.session.query(
            Application.branch_code,
            func.count(Application.id).label('count')
        ).filter(
            Application.assigned_to_id == current_user.id if current_user.is_officer() else True
        ).group_by(Application.branch_code).order_by(
            func.count(Application.id).desc()
        ).limit(10).all()
        
        # Pending applications older than 3 days
        three_days_ago = today - timedelta(days=3)
        old_pending = base_query.filter(
            and_(
                Application.status == 'PENDING',
                Application.updated_at < three_days_ago
            )
        ).count()
        
        # Assignment statistics (for admin/viewer)
        assignment_stats = {}
        if not current_user.is_officer():
            total_apps = Application.query.count()
            assigned_apps = Application.query.filter(Application.assigned_to_id.isnot(None)).count()
            unassigned_apps = total_apps - assigned_apps
            
            assignment_stats = {
                'total_applications': total_apps,
                'assigned_applications': assigned_apps,
                'unassigned_applications': unassigned_apps
            }
        
        # Recent activity (last 10 history entries)
        recent_activity_query = ApplicationHistory.query
        if current_user.is_officer():
            # Filter to applications assigned to current user
            recent_activity_query = recent_activity_query.join(Application).filter(
                Application.assigned_to_id == current_user.id
            )
        
        recent_activity = recent_activity_query.order_by(
            ApplicationHistory.timestamp.desc()
        ).limit(10).all()
        
        return jsonify({
            'dashboard_metrics': {
                'total_applications': base_query.count(),
                'today_applications': today_query.count(),
                'status_counts': status_counts,
                'type_counts': type_counts,
                'branch_counts': [{'branch_code': bc[0], 'count': bc[1]} for bc in branch_counts],
                'old_pending_count': old_pending,
                'assignment_stats': assignment_stats,
                'recent_activity': [activity.to_dict() for activity in recent_activity]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/daily', methods=['GET'])
@login_required
def get_daily_report():
    """Get daily task report"""
    try:
        current_user = get_current_user()
        report_date = request.args.get('date', date.today().isoformat())
        
        # Parse date
        target_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        # Base query
        base_query = Application.query.filter(Application.date == target_date)
        
        # Role-based filtering
        if current_user.is_officer():
            base_query = base_query.filter(Application.assigned_to_id == current_user.id)
        
        # Get breakdown by card type and status
        breakdown = db.session.query(
            Application.type,
            Application.status,
            func.count(Application.id).label('count')
        ).filter(
            Application.date == target_date
        )
        
        if current_user.is_officer():
            breakdown = breakdown.filter(Application.assigned_to_id == current_user.id)
        
        breakdown = breakdown.group_by(
            Application.type, Application.status
        ).all()
        
        # Organize data
        report_data = defaultdict(lambda: defaultdict(int))
        for type_name, status, count in breakdown:
            report_data[type_name][status] = count
        
        # Officer-wise breakdown (for admin/viewer)
        officer_breakdown = []
        if not current_user.is_officer():
            officer_data = db.session.query(
                User.username,
                Application.status,
                func.count(Application.id).label('count')
            ).join(
                Application, User.id == Application.assigned_to_id
            ).filter(
                Application.date == target_date
            ).group_by(
                User.username, Application.status
            ).all()
            
            officer_stats = defaultdict(lambda: defaultdict(int))
            for username, status, count in officer_data:
                officer_stats[username][status] = count
            
            officer_breakdown = [
                {
                    'officer': officer,
                    'stats': dict(stats)
                }
                for officer, stats in officer_stats.items()
            ]
        
        return jsonify({
            'daily_report': {
                'date': report_date,
                'breakdown_by_type': dict(report_data),
                'officer_breakdown': officer_breakdown,
                'total_applications': base_query.count()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/branch-wise', methods=['GET'])
@login_required
def get_branch_wise_report():
    """Get branch-wise report"""
    try:
        current_user = get_current_user()
        
        # Base query
        base_query = Application.query
        
        # Role-based filtering
        if current_user.is_officer():
            base_query = base_query.filter(Application.assigned_to_id == current_user.id)
        
        # Get branch-wise breakdown
        branch_data = db.session.query(
            Application.branch_code,
            Application.status,
            func.count(Application.id).label('count')
        )
        
        if current_user.is_officer():
            branch_data = branch_data.filter(Application.assigned_to_id == current_user.id)
        
        branch_data = branch_data.group_by(
            Application.branch_code, Application.status
        ).all()
        
        # Organize data
        branch_stats = defaultdict(lambda: defaultdict(int))
        for branch_code, status, count in branch_data:
            branch_stats[branch_code][status] = count
        
        # Calculate totals and add assigned officer info (for admin/viewer)
        branch_report = []
        for branch_code, stats in branch_stats.items():
            total = sum(stats.values())
            
            # Get assigned officers for this branch (for admin/viewer)
            assigned_officers = []
            if not current_user.is_officer():
                officers = db.session.query(
                    User.username,
                    func.count(Application.id).label('count')
                ).join(
                    Application, User.id == Application.assigned_to_id
                ).filter(
                    Application.branch_code == branch_code
                ).group_by(User.username).all()
                
                assigned_officers = [
                    {'officer': officer[0], 'count': officer[1]}
                    for officer in officers
                ]
            
            branch_report.append({
                'branch_code': branch_code,
                'total': total,
                'status_breakdown': dict(stats),
                'assigned_officers': assigned_officers
            })
        
        # Sort by total applications
        branch_report.sort(key=lambda x: x['total'], reverse=True)
        
        return jsonify({
            'branch_wise_report': branch_report
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/officer-performance', methods=['GET'])
@login_required
def get_officer_performance_report():
    """Get officer performance report"""
    try:
        current_user = get_current_user()
        
        if current_user.is_officer():
            # Officers can only see their own performance
            officers_to_check = [current_user.id]
        else:
            # Admin/viewer can see all officers
            officers_to_check = [user.id for user in User.query.filter_by(role='OFFICER', is_active=True).all()]
        
        performance_data = []
        
        for officer_id in officers_to_check:
            officer = User.query.get(officer_id)
            if not officer:
                continue
            
            # Get officer's applications
            officer_apps = Application.query.filter_by(assigned_to_id=officer_id)
            
            # Status breakdown
            status_counts = {}
            for status in Application.get_status_choices():
                count = officer_apps.filter(Application.status == status).count()
                status_counts[status] = count
            
            # Calculate average processing time for completed applications
            completed_apps = officer_apps.filter(Application.status == 'DONE').all()
            avg_duration = 0
            if completed_apps:
                total_duration = 0
                for app in completed_apps:
                    if app.created_at and app.updated_at:
                        duration = (app.updated_at - app.created_at).days
                        total_duration += duration
                avg_duration = round(total_duration / len(completed_apps), 1)
            
            # Find oldest pending application
            oldest_pending = officer_apps.filter(Application.status == 'PENDING').order_by(
                Application.updated_at.asc()
            ).first()
            
            oldest_pending_days = 0
            if oldest_pending and oldest_pending.updated_at:
                oldest_pending_days = (datetime.now() - oldest_pending.updated_at).days
            
            performance_data.append({
                'officer_id': officer.id,
                'officer_name': officer.username,
                'employee_id': officer.employee_id,
                'department': officer.department,
                'total_assigned': officer_apps.count(),
                'status_breakdown': status_counts,
                'avg_processing_days': avg_duration,
                'oldest_pending_days': oldest_pending_days
            })
        
        return jsonify({
            'officer_performance': performance_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/custom', methods=['POST'])
@login_required
def get_custom_report():
    """Get custom report with date range and filters"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        # Parse parameters
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        card_type = data.get('card_type')
        status = data.get('status')
        branch_code = data.get('branch_code')
        officer_id = data.get('officer_id')
        
        # Base query
        query = Application.query
        
        # Role-based filtering
        if current_user.is_officer():
            query = query.filter(Application.assigned_to_id == current_user.id)
        
        # Apply filters
        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Application.date >= start_dt)
        
        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Application.date <= end_dt)
        
        if card_type:
            query = query.filter(Application.type == card_type)
        
        if status:
            query = query.filter(Application.status == status)
        
        if branch_code:
            query = query.filter(Application.branch_code == branch_code)
        
        if officer_id and (current_user.is_admin() or current_user.is_viewer()):
            query = query.filter(Application.assigned_to_id == officer_id)
        
        applications = query.all()
        
        # Generate summary statistics
        summary = {
            'total_applications': len(applications),
            'status_breakdown': {},
            'type_breakdown': {},
            'branch_breakdown': {}
        }
        
        for app in applications:
            # Status breakdown
            summary['status_breakdown'][app.status] = summary['status_breakdown'].get(app.status, 0) + 1
            
            # Type breakdown
            summary['type_breakdown'][app.type] = summary['type_breakdown'].get(app.type, 0) + 1
            
            # Branch breakdown
            summary['branch_breakdown'][app.branch_code] = summary['branch_breakdown'].get(app.branch_code, 0) + 1
        
        return jsonify({
            'custom_report': {
                'filters': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'card_type': card_type,
                    'status': status,
                    'branch_code': branch_code,
                    'officer_id': officer_id
                },
                'summary': summary,
                'applications': [app.to_dict() for app in applications]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/reports/export/excel', methods=['POST'])
@login_required
def export_excel_report():
    """Export report data to Excel"""
    try:
        current_user = get_current_user()
        data = request.get_json()
        
        # Get applications based on filters (reuse custom report logic)
        # ... (similar filtering logic as custom_report)
        
        # For now, export all accessible applications
        query = Application.query
        if current_user.is_officer():
            query = query.filter(Application.assigned_to_id == current_user.id)
        
        applications = query.all()
        
        # Convert to DataFrame
        app_data = []
        for app in applications:
            app_data.append({
                'Date': app.date,
                'Branch Code': app.branch_code,
                'App ID': app.app_id,
                'Name': app.name,
                'Card': app.card,
                'Type': app.type,
                'Status': app.status,
                'Remarks': app.remarks,
                'Assigned To': app.assigned_to.username if app.assigned_to else '',
                'PF Continue Matched': app.pf_continue_matched,
                'Created At': app.created_at,
                'Updated At': app.updated_at
            })
        
        df = pd.DataFrame(app_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Applications', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'credit_card_applications_{date.today().isoformat()}.xlsx'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

