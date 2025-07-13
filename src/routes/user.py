from flask import Blueprint, request, jsonify
from src.models.user import User, db
from src.routes.auth import login_required, admin_required, get_current_user

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    """Get all users (admin/viewer) or current user info (officer)"""
    try:
        current_user = get_current_user()
        
        if current_user.is_officer():
            # Officers can only see their own info
            return jsonify({'users': [current_user.to_dict()]}), 200
        
        # Admin and viewers can see all users
        users = User.query.filter_by(is_active=True).all()
        return jsonify({'users': [user.to_dict() for user in users]}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """Create new user (admin only)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'OFFICER'),
            employee_id=data.get('employee_id'),
            department=data.get('department'),
            phone_number=data.get('phone_number')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@login_required
def get_user(user_id):
    """Get user by ID"""
    try:
        current_user = get_current_user()
        
        # Officers can only view their own profile
        if current_user.is_officer() and current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        user = User.query.get_or_404(user_id)
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    """Update user"""
    try:
        current_user = get_current_user()
        user = User.query.get_or_404(user_id)
        
        # Officers can only update their own profile (limited fields)
        if current_user.is_officer() and current_user.id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Admin can update all fields
        if current_user.is_admin():
            if 'username' in data:
                # Check username uniqueness
                existing = User.query.filter_by(username=data['username']).first()
                if existing and existing.id != user_id:
                    return jsonify({'error': 'Username already exists'}), 400
                user.username = data['username']
            
            if 'email' in data:
                # Check email uniqueness
                existing = User.query.filter_by(email=data['email']).first()
                if existing and existing.id != user_id:
                    return jsonify({'error': 'Email already exists'}), 400
                user.email = data['email']
            
            if 'role' in data:
                user.role = data['role']
            if 'employee_id' in data:
                user.employee_id = data['employee_id']
            if 'department' in data:
                user.department = data['department']
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            # Password change
            if 'password' in data:
                user.set_password(data['password'])
        
        # Officers can update limited fields
        else:
            if 'email' in data:
                # Check email uniqueness
                existing = User.query.filter_by(email=data['email']).first()
                if existing and existing.id != user_id:
                    return jsonify({'error': 'Email already exists'}), 400
                user.email = data['email']
            
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
            if 'department' in data:
                user.department = data['department']
        
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete user (admin only)"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Soft delete by setting is_active to False
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/officers', methods=['GET'])
@login_required
def get_officers():
    """Get all active officers for assignment purposes"""
    try:
        current_user = get_current_user()
        
        # Only admin and viewers can see all officers
        if current_user.is_officer():
            return jsonify({'error': 'Access denied'}), 403
        
        officers = User.query.filter_by(role='OFFICER', is_active=True).all()
        return jsonify({'officers': [officer.to_dict() for officer in officers]}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/roles', methods=['GET'])
@login_required
def get_user_roles():
    """Get available user roles"""
    try:
        return jsonify({'roles': User.get_role_choices()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500