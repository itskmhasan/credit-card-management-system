# Database Schema and Application Architecture

**Author:** Manus AI  
**Date:** July 13, 2025  
**Version:** 1.0

## Executive Summary

This document presents a comprehensive database schema and application architecture for the Credit Card Application Management System. The system is designed to handle the end-to-end process of credit card application management, from raw CMS data ingestion to final application processing and reporting. The architecture follows modern web development practices with a Flask-based backend API and React frontend, ensuring scalability, maintainability, and user-friendly operation.

## 1. System Overview and Architecture

The Credit Card Application Management System is designed as a three-tier web application architecture consisting of a presentation layer (React frontend), business logic layer (Flask API backend), and data persistence layer (SQLite/PostgreSQL database). This separation of concerns ensures modularity, scalability, and ease of maintenance.

The system workflow begins with the ingestion of raw CMS data, which contains combined card information per customer. This data undergoes parsing to create individual application records for each card type and position (MAIN/SUPPLEMENTARY). Officers then perform manual verification tasks, updating application statuses and adding remarks as needed. The system also supports cross-checking with external division data provided in Excel format, highlighting matched and unmatched entries for further investigation.

The architecture emphasizes role-based access control, with distinct permissions for administrators, officers, and viewers. Administrators have full system access including data upload, user management, and assignment capabilities. Officers can only edit and view applications assigned to them, ensuring data security and workflow integrity. Viewers have read-only access for monitoring and reporting purposes.

## 2. Database Schema Design

### 2.1 Core Models

The database schema is built around several core models that represent the primary entities in the credit card application management workflow. Each model is designed to capture essential information while maintaining referential integrity and supporting efficient querying for reporting and analytics.

#### 2.1.1 User Model

The User model extends Django's built-in authentication system to support role-based access control and user management functionality.

```python
class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('OFFICER', 'Officer'),
        ('VIEWER', 'Viewer'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='OFFICER')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

The User model incorporates role-based permissions that align with the system's access control requirements. The employee_id field provides a unique identifier for organizational purposes, while the department field enables departmental reporting and assignment logic. The phone_number field supports communication workflows where officers need to contact customers for verification purposes.

#### 2.1.2 Application Model

The Application model represents individual credit card applications and serves as the central entity in the system. This model captures all essential information about each application, including customer details, card specifications, processing status, and assignment information.

```python
class Application(models.Model):
    CARD_CHOICES = [
        ('MAIN', 'Main Card'),
        ('SUPPLE', 'Supplementary Card'),
    ]
    
    TYPE_CHOICES = [
        ('CLASSIC', 'Classic'),
        ('GOLD', 'Gold'),
        ('PLATINUM', 'Platinum'),
    ]
    
    STATUS_CHOICES = [
        ('UNTOUCH', 'Untouched'),
        ('PENDING', 'Pending'),
        ('HOLD', 'Hold'),
        ('DONE', 'Done'),
    ]
    
    # Core application data
    date = models.DateField()
    branch_code = models.CharField(max_length=10)
    app_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    card = models.CharField(max_length=10, choices=CARD_CHOICES)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    
    # Processing information
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UNTOUCH')
    remarks = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_applications')
    
    # Additional tracking fields
    work_on = models.CharField(max_length=100, blank=True)
    inform_to = models.CharField(max_length=100, blank=True)
    ipt = models.CharField(max_length=50, blank=True)
    
    # Cross-check information
    pf_continue_matched = models.BooleanField(default=False)
    pf_continue_remarks = models.TextField(blank=True, null=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_applications')
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'assigned_to']),
            models.Index(fields=['branch_code', 'date']),
            models.Index(fields=['type', 'card']),
            models.Index(fields=['app_id']),
        ]
```

The Application model includes comprehensive indexing to support efficient querying for dashboard metrics, reporting, and filtering operations. The status field drives the workflow progression, while the assigned_to field enables workload distribution among officers. The pf_continue_matched field supports the cross-checking functionality with external division data.

#### 2.1.3 ApplicationHistory Model

The ApplicationHistory model provides audit trail functionality, tracking all changes made to application records. This model is essential for compliance, debugging, and performance monitoring purposes.

```python
class ApplicationHistory(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('ASSIGN', 'Assigned'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('REMARK_ADDED', 'Remark Added'),
    ]
    
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_value = models.JSONField(blank=True, null=True)
    new_value = models.JSONField(blank=True, null=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['application', 'timestamp']),
            models.Index(fields=['changed_by', 'timestamp']),
        ]
```

The ApplicationHistory model uses JSON fields to store old and new values, providing flexibility for tracking changes to any application field. The action field categorizes the type of change, enabling filtered audit reports and analytics on user behavior patterns.

### 2.2 Supporting Models

#### 2.2.1 PFContinueData Model

The PFContinueData model stores data from the external division for cross-checking purposes. This model enables the system to identify matches and discrepancies between internal applications and external records.

```python
class PFContinueData(models.Model):
    app_id = models.CharField(max_length=20)
    customer_name = models.CharField(max_length=255)
    branch_code = models.CharField(max_length=10)
    upload_date = models.DateField()
    additional_data = models.JSONField(blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['app_id']),
            models.Index(fields=['upload_date']),
        ]
```

The additional_data JSON field accommodates varying data structures from different Excel uploads, providing flexibility for future data format changes. The upload_date field enables temporal analysis of cross-checking data.

#### 2.2.2 CMSRawData Model

The CMSRawData model stores the original raw data from the Card Management System before parsing. This model serves as a backup and enables reprocessing if parsing logic changes.

```python
class CMSRawData(models.Model):
    raw_content = models.TextField()
    upload_date = models.DateField()
    processed = models.BooleanField(default=False)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['upload_date', 'processed']),
        ]
```

The processed field tracks whether the raw data has been successfully parsed into Application records, enabling error recovery and reprocessing capabilities.

## 3. API Endpoint Design

The API design follows RESTful principles with clear resource-based URLs and appropriate HTTP methods. The API is organized into logical groups based on functionality, ensuring intuitive navigation and consistent behavior patterns.

### 3.1 Authentication and User Management

The authentication system supports JWT-based token authentication for stateless API access, while also maintaining session-based authentication for web interface compatibility.

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/profile
PUT /api/auth/profile

GET /api/users/
POST /api/users/
GET /api/users/{id}/
PUT /api/users/{id}/
DELETE /api/users/{id}/
```

The user management endpoints support full CRUD operations with role-based access control. Only administrators can create, update, or delete user accounts, while officers can view their own profile information and update limited fields.

### 3.2 Application Management

The application management endpoints provide comprehensive functionality for handling credit card applications throughout their lifecycle.

```
GET /api/applications/
POST /api/applications/
GET /api/applications/{id}/
PUT /api/applications/{id}/
DELETE /api/applications/{id}/

GET /api/applications/assigned/
PUT /api/applications/{id}/status/
PUT /api/applications/{id}/assign/
GET /api/applications/{id}/history/

POST /api/applications/bulk-upload/
POST /api/applications/parse-cms/
```

The bulk-upload endpoint handles Excel file uploads and automatic parsing into Application records. The parse-cms endpoint processes raw CMS data according to the specified format requirements, splitting combined records into individual applications.

### 3.3 Cross-checking and PFContinue

The cross-checking functionality enables comparison between internal applications and external division data.

```
POST /api/pfcontinue/upload/
GET /api/pfcontinue/
POST /api/pfcontinue/cross-check/
GET /api/applications/unmatched/
PUT /api/applications/{id}/match-status/
```

The cross-check endpoint performs automated matching based on application IDs and provides detailed reports on matched and unmatched records. The match-status endpoint allows manual override of automatic matching results.

### 3.4 Reporting and Analytics

The reporting endpoints provide comprehensive analytics and export functionality for various stakeholder needs.

```
GET /api/reports/dashboard/
GET /api/reports/daily/
GET /api/reports/branch-wise/
GET /api/reports/officer-performance/
GET /api/reports/custom/

GET /api/reports/export/excel/
GET /api/reports/export/pdf/
```

The dashboard endpoint provides real-time metrics for the main dashboard interface, while specialized report endpoints offer detailed analytics for specific use cases. Export endpoints generate downloadable files in Excel and PDF formats.

## 4. Data Flow and Processing Logic

The system's data flow follows a structured pipeline from raw data ingestion to final reporting. Understanding this flow is crucial for system maintenance and troubleshooting.

### 4.1 CMS Data Processing Pipeline

The CMS data processing begins with raw data upload through the web interface or API. The raw data follows the specified format: Date | Branch Code | App ID | Name | (1,2,3) | (VSCC, VSCG, VSCP), where the position numbers indicate MAIN (1) or SUPPLEMENTARY (2,3) cards, and the card codes represent CLASSIC, GOLD, and PLATINUM types respectively.

The parsing logic extracts individual card applications from combined records, creating separate Application instances for each card type and position combination. This process includes data validation, duplicate detection, and error handling to ensure data integrity. The parser maintains relationships between related applications (same customer, different card types) through shared application ID prefixes or customer information.

### 4.2 Status Workflow Management

The application status workflow follows a defined progression: UNTOUCH → PENDING → (HOLD) → DONE. The system enforces business rules around status transitions, ensuring that applications cannot skip required steps or move backward without proper authorization.

When an application moves to PENDING status, it must be assigned to an officer. The assignment can be manual (by administrators) or automatic (based on workload balancing algorithms). Officers can update status to HOLD when issues are identified, requiring mandatory remarks explaining the reason for the hold.

The DONE status indicates completion of all verification and processing tasks. Applications in DONE status are included in completion metrics and can be archived or exported for final processing by downstream systems.

### 4.3 Cross-checking Logic

The cross-checking process compares internal Application records with uploaded PFContinue data based on application IDs. The system performs fuzzy matching to account for minor data entry variations and provides confidence scores for each match.

Unmatched applications are flagged for manual review, while matched applications are automatically updated with cross-check status. The system maintains detailed logs of all cross-checking activities for audit purposes and provides reports on matching accuracy and discrepancy patterns.

## 5. Security and Access Control

Security is implemented through multiple layers, including authentication, authorization, data validation, and audit logging. The system follows security best practices to protect sensitive customer information and maintain data integrity.

### 5.1 Role-Based Access Control

The three-tier role system (Admin, Officer, Viewer) provides granular control over system functionality. Administrators have full access to all features including user management, data upload, and system configuration. Officers can only access applications assigned to them and cannot view or modify other officers' work. Viewers have read-only access for monitoring and reporting purposes.

Permission checking occurs at both the API level and the frontend interface level, ensuring consistent security enforcement. The system logs all access attempts and permission violations for security monitoring and compliance purposes.

### 5.2 Data Protection and Privacy

Customer data is protected through encryption at rest and in transit. Sensitive fields such as customer names and application details are encrypted in the database using industry-standard algorithms. API communications use HTTPS with proper certificate validation.

The system implements data retention policies, automatically archiving or purging old records according to regulatory requirements. Access to archived data requires special permissions and is logged for compliance purposes.

## 6. Performance and Scalability Considerations

The system is designed to handle growing data volumes and user loads through efficient database design, caching strategies, and scalable architecture patterns.

### 6.1 Database Optimization

Database performance is optimized through strategic indexing on frequently queried fields such as status, assigned_to, branch_code, and date. The index strategy balances query performance with storage overhead and update performance.

Query optimization includes the use of database-level aggregations for reporting functions, reducing the need for application-level data processing. The system uses connection pooling and query caching to minimize database load during peak usage periods.

### 6.2 Caching Strategy

The application implements multi-level caching including database query caching, API response caching, and frontend data caching. Dashboard metrics and report data are cached with appropriate expiration times to balance data freshness with performance.

Static assets and frequently accessed data are cached at the CDN level for global performance optimization. The caching strategy includes cache invalidation mechanisms to ensure data consistency when underlying records are updated.

## 7. Integration and Extensibility

The system architecture supports future integrations and feature extensions through well-defined APIs and modular design patterns.

### 7.1 External System Integration

The API design accommodates integration with external systems such as core banking platforms, customer relationship management systems, and regulatory reporting tools. Standard data formats and protocols ensure compatibility with common enterprise systems.

The system provides webhook capabilities for real-time notifications to external systems when application statuses change or specific events occur. This enables automated workflows and reduces manual coordination between systems.

### 7.2 Future Enhancement Capabilities

The modular architecture supports the addition of new features such as automated decision engines, machine learning-based fraud detection, and advanced analytics capabilities. The database schema includes extensibility fields and JSON storage for accommodating new data requirements without schema changes.

The API versioning strategy ensures backward compatibility while enabling the introduction of new features and improvements. The frontend architecture supports plugin-based extensions for custom functionality specific to different organizational needs.

## Conclusion

This database schema and application architecture provides a robust foundation for the Credit Card Application Management System. The design balances functionality, performance, security, and maintainability while supporting the specific workflow requirements outlined in the system specifications. The architecture's modular design and extensibility features ensure that the system can evolve with changing business needs and technological advances.

The comprehensive audit trail, role-based access control, and reporting capabilities provide the transparency and accountability required for financial services applications. The system's scalable design ensures reliable performance as data volumes and user loads increase over time.

