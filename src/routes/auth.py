from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current logged-in user"""
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.is_active:
            session['user_id'] = user.id
            session['user_role'] = user.role
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """User logout endpoint"""
    try:
        session.clear()
        return jsonify({'message': 'Logout successful'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    """Get current user profile"""
    try:
        user = get_current_user()
        if user:
            return jsonify({'user': user.to_dict()}), 200
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update current user profile"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Allow users to update limited fields
        if 'email' in data:
            user.email = data['email']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'department' in data:
            user.department = data['department']
        
        # Only allow password change if current password is provided
        if 'new_password' in data and 'current_password' in data:
            if user.check_password(data['current_password']):
                user.set_password(data['new_password'])
            else:
                return jsonify({'error': 'Current password is incorrect'}), 400
        
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/check-session', methods=['GET'])
def check_session():
    """Check if user is logged in"""
    try:
        user = get_current_user()
        if user:
            return jsonify({
                'authenticated': True,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'authenticated': False}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

