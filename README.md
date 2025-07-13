# Credit Card Application Management System

A comprehensive web application for managing credit card applications with role-based access control, reporting, and analytics features.

## Features

### Core Functionality
- **Application Management**: Create, view, update, and track credit card applications
- **Role-Based Access Control**: Admin, Officer, and Viewer roles with different permissions
- **Status Tracking**: UNTOUCH, PENDING, HOLD, DONE status management
- **Assignment System**: Assign applications to specific officers
- **Audit Trail**: Complete history tracking of all application changes

### Data Management
- **CMS Data Upload**: Upload and process Excel files containing application data
- **PFContinue Integration**: Cross-check applications with PFContinue data
- **Data Validation**: Automatic validation and error checking
- **Bulk Operations**: Process multiple applications simultaneously

### Reporting & Analytics
- **Dashboard**: Real-time overview with key metrics and charts
- **Daily Reports**: Task completion and performance tracking
- **Branch Reports**: Branch-wise application statistics
- **Officer Performance**: Individual officer productivity metrics
- **Excel Export**: Export filtered data to Excel format
- **Visual Analytics**: Charts and graphs for data visualization

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with color-coded status indicators
- **Advanced Filtering**: Filter applications by multiple criteria
- **Search Functionality**: Quick search across all application fields
- **Pagination**: Efficient handling of large datasets

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: Session-based with password hashing
- **API**: RESTful endpoints with JSON responses
- **File Processing**: Pandas for Excel file handling

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js for data visualization
- **Routing**: React Router for navigation
- **State Management**: React Context API

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- pnpm (for frontend dependencies)

### Backend Setup
1. Navigate to the project directory:
   ```bash
   cd credit-card-app
   ```

2. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize database with sample data:
   ```bash
   python create_sample_data.py
   ```

5. Start the Flask server:
   ```bash
   python src/main.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup (Development)
1. Navigate to the frontend directory:
   ```bash
   cd ../credit-card-frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start development server:
   ```bash
   pnpm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Production Deployment
For production, the frontend is built and served by the Flask backend:

1. Build the frontend:
   ```bash
   cd credit-card-frontend
   pnpm run build
   ```

2. Copy built files to Flask static directory:
   ```bash
   cp -r dist/* ../credit-card-app/src/static/
   ```

3. Start Flask server:
   ```bash
   cd ../credit-card-app
   source venv/bin/activate
   python src/main.py
   ```

The complete application will be available at `http://localhost:5000`

## Default Login Credentials

### Admin User
- **Username**: admin
- **Password**: admin123
- **Permissions**: Full access to all features

### Viewer User
- **Username**: viewer
- **Password**: viewer123
- **Permissions**: Read-only access to applications and reports

### Officer Users
- **Username**: john_doe, jane_smith, mike_wilson, sarah_johnson
- **Password**: password123
- **Permissions**: Manage assigned applications, view reports

## Database Schema

### Users Table
- User authentication and role management
- Employee ID and department tracking
- Password hashing for security

### Applications Table
- Core application data (ID, name, branch, card type, etc.)
- Status and assignment tracking
- Timestamps for creation and updates

### Application History Table
- Complete audit trail of all changes
- Action tracking (create, update, assign, status change)
- User attribution for all modifications

### PFContinue Data Table
- Cross-reference data for application verification
- Upload tracking and metadata
- Additional data storage in JSON format

### CMS Raw Data Table
- Raw uploaded data storage
- Processing status tracking
- Error logging and validation results

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Applications
- `GET /api/applications` - List applications with filtering
- `GET /api/applications/<id>` - Get specific application
- `PUT /api/applications/<id>` - Update application
- `POST /api/applications/bulk-update` - Update multiple applications
- `GET /api/applications/export` - Export to Excel

### Data Upload
- `POST /api/upload/cms` - Upload CMS Excel file
- `POST /api/upload/pfcontinue` - Upload PFContinue data
- `GET /api/upload/history` - View upload history

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/daily` - Daily task reports
- `GET /api/reports/branch` - Branch-wise reports
- `GET /api/reports/officer` - Officer performance reports

### Cross-checking
- `GET /api/pfcontinue/cross-check` - Compare with PFContinue data
- `POST /api/pfcontinue/match` - Mark applications as matched

### User Management (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

## File Structure

```
credit-card-app/
├── src/
│   ├── models/           # Database models
│   │   ├── user.py
│   │   ├── application.py
│   │   ├── application_history.py
│   │   ├── pf_continue_data.py
│   │   └── cms_raw_data.py
│   ├── routes/           # API endpoints
│   │   ├── auth.py
│   │   ├── application.py
│   │   ├── user.py
│   │   ├── pfcontinue.py
│   │   └── reports.py
│   ├── static/           # Frontend build files
│   ├── database/         # SQLite database
│   └── main.py          # Flask application entry point
├── create_sample_data.py # Database initialization script
├── requirements.txt      # Python dependencies
└── README.md            # This file

credit-card-frontend/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── contexts/        # React contexts
│   └── App.jsx          # Main application component
├── public/              # Static assets
├── package.json         # Node.js dependencies
└── vite.config.js       # Vite configuration
```

## Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **Session Management**: Server-side session handling
- **Role-Based Access**: Different permission levels for different user types
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexing
- **Pagination**: Efficient handling of large datasets
- **Lazy Loading**: Components load data as needed
- **Caching**: Browser caching for static assets
- **Minification**: Production builds are minified and optimized

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure the database directory exists
   - Run `python create_sample_data.py` to initialize

2. **Import Errors**
   - Activate virtual environment: `source venv/bin/activate`
   - Install dependencies: `pip install -r requirements.txt`

3. **Frontend Build Issues**
   - Clear node_modules: `rm -rf node_modules && pnpm install`
   - Rebuild: `pnpm run build`

4. **Permission Denied**
   - Check file permissions
   - Ensure proper user roles in database

### Logs and Debugging

- Flask debug mode is enabled by default in development
- Check browser console for frontend errors
- Database queries are logged in debug mode
- File upload errors are logged to console

## Future Enhancements

- **Email Notifications**: Automated email alerts for status changes
- **Advanced Analytics**: More detailed reporting and insights
- **Mobile App**: Native mobile application
- **API Rate Limiting**: Enhanced security measures
- **Real-time Updates**: WebSocket integration for live updates
- **Document Management**: File attachment support
- **Integration APIs**: Connect with external banking systems

## Support

For technical support or questions about the application:
1. Check the troubleshooting section above
2. Review the API documentation
3. Examine the sample data and test cases
4. Contact the development team

## License

This application is developed for internal use. All rights reserved.

