# Auth Service Admin Endpoints Documentation

## Overview

This document provides comprehensive testing information for all admin endpoints in the Auth Service. These endpoints are designed to support the MSTAFIX admin dashboard.

## Base URLs

The admin endpoints are available at multiple paths for compatibility:
- `/api/v1/admin`
- `/api/admin` 
- `/admin`
- `/api/v1/auth/admin`
- `/api/auth/admin`
- `/auth/admin`

## Authentication

All admin endpoints require:
1. **JWT Token**: Valid authentication token
2. **Admin Role**: User must have `ADMIN` role

### Token Format
```
Authorization: Bearer <jwt_token>
```

Or via cookies:
```
Cookie: token=<jwt_token>
Cookie: authToken=<jwt_token>
```

## Endpoints

### 1. Get All Users
**GET** `/admin/users`

Retrieve paginated list of users with filtering and sorting options.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `search` (string) - Search in name and email
- `role` (string) - Filter by role: USER, ADMIN, all
- `status` (string) - Filter by status: active, inactive, all
- `sortBy` (string, default: createdAt) - Sort field: createdAt, updatedAt, name, email, role
- `sortOrder` (string, default: desc) - Sort order: asc, desc

**Example Request:**
```bash
curl -X GET "http://localhost:3001/admin/users?page=1&limit=10&search=john&role=USER&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "data": [
    {
      "id": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "questionCount": 0,
      "generationCount": 0
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 45,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "limit": 10
  }
}
```

### 2. Get Single User
**GET** `/admin/users/:userId`

Retrieve detailed information for a specific user.

**Example Request:**
```bash
curl -X GET "http://localhost:3001/admin/users/user123" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "questionCount": 0,
    "generationCount": 0
  }
}
```

### 3. Create New User
**POST** `/admin/users`

Create a new user account.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "USER"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3001/admin/users" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com", 
    "password": "securePassword123",
    "role": "USER"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user456",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "role": "USER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": null,
    "questionCount": 0,
    "generationCount": 0
  }
}
```

### 4. Update User
**PUT** `/admin/users/:userId`

Update user information.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "ADMIN"
}
```

**Example Request:**
```bash
curl -X PUT "http://localhost:3001/admin/users/user456" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "ADMIN"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user456",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "lastLoginAt": "2024-01-01T12:00:00.000Z",
    "questionCount": 0,
    "generationCount": 0
  }
}
```

### 5. Delete User
**DELETE** `/admin/users/:userId`

Delete a user account. Cannot delete own account or last admin.

**Example Request:**
```bash
curl -X DELETE "http://localhost:3001/admin/users/user456" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 6. Bulk User Operations
**POST** `/admin/users/bulk`

Perform bulk operations on multiple users.

**Request Body:**
```json
{
  "userIds": ["user123", "user456", "user789"],
  "operation": "update_role",
  "data": {
    "role": "USER"
  }
}
```

**Available Operations:**
- `delete` - Bulk delete users
- `update_role` - Bulk update user roles

**Example Request:**
```bash
curl -X POST "http://localhost:3001/admin/users/bulk" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user123", "user456"],
    "operation": "update_role",
    "data": {
      "role": "USER"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk update_role completed successfully",
  "affected": 2
}
```

### 7. Get User Statistics
**GET** `/admin/users/stats`

Get user statistics for a specific time period.

**Query Parameters:**
- `period` (string, default: 30d) - Time period: 7d, 30d, 90d, 1y

**Example Request:**
```bash
curl -X GET "http://localhost:3001/admin/users/stats?period=30d" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "total": 150,
  "active": 45,
  "new": 12,
  "growth": {
    "total": 12,
    "percentage": "8.7"
  },
  "distribution": {
    "byRole": [
      {
        "name": "USER",
        "value": 130
      },
      {
        "name": "ADMIN", 
        "value": 20
      }
    ]
  },
  "trends": [
    {
      "date": "2024-01-01",
      "count": 5
    },
    {
      "date": "2024-01-02", 
      "count": 3
    }
  ],
  "recentActivity": [
    {
      "id": "user-reg-user123",
      "type": "user_registration",
      "description": "John Doe joined the platform",
      "user": "John Doe",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "COMPLETED"
    }
  ],
  "period": "30d"
}
```

### 8. Get User Analytics
**GET** `/admin/analytics/users`

Get comprehensive user analytics for dashboard.

**Query Parameters:**
- `period` (string, default: 30d) - Time period: 7d, 30d, 90d, 1y

**Example Request:**
```bash
curl -X GET "http://localhost:3001/admin/analytics/users?period=30d" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "overview": {
    "total": 150,
    "active": 45,
    "new": 12,
    "growth": {
      "absolute": 12,
      "percentage": 8.7
    }
  },
  "distribution": {
    "byRole": [
      {
        "name": "USER",
        "value": 130,
        "percentage": 86.7
      },
      {
        "name": "ADMIN",
        "value": 20,
        "percentage": 13.3
      }
    ]
  },
  "trends": {
    "registrations": [
      {
        "date": "2024-01-01",
        "count": 5
      }
    ],
    "activity": [
      {
        "date": "2024-01-01",
        "count": 25
      }
    ]
  },
  "recentActivity": [
    {
      "id": "user-reg-user123",
      "type": "user_registration",
      "description": "John Doe joined the platform",
      "user": "John Doe",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "status": "COMPLETED",
      "metadata": {
        "userId": "user123",
        "email": "john@example.com",
        "role": "USER"
      }
    }
  ],
  "period": "30d",
  "dateRange": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  }
}
```

### 9. System Health Check
**GET** `/admin/health`

Check auth service system health.

**Example Request:**
```bash
curl -X GET "http://localhost:3001/admin/health" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connected": true,
    "status": "healthy"
  },
  "metrics": {
    "totalUsers": 150,
    "recentSignups": 5,
    "uptime": 3600
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access token required",
  "code": "TOKEN_MISSING"
}
```

### 403 Forbidden
```json
{
  "error": "Admin privileges required",
  "code": "INSUFFICIENT_PRIVILEGES",
  "userRole": "USER",
  "requiredRole": "ADMIN"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid pagination parameters"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch users"
}
```

## Testing Scripts

### Test Authentication
```bash
#!/bin/bash

# Login to get token
TOKEN=$(curl -s -X POST "http://localhost:3001/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq -r '.token')

echo "Token: $TOKEN"

# Test admin endpoint
curl -X GET "http://localhost:3001/admin/users" \
  -H "Authorization: Bearer $TOKEN"
```

### Test User Creation
```bash
#!/bin/bash

curl -X POST "http://localhost:3001/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "USER"
  }'
```

### Test Analytics
```bash
#!/bin/bash

curl -X GET "http://localhost:3001/admin/analytics/users?period=30d" \
  -H "Authorization: Bearer $TOKEN"
```

## Rate Limiting

The middleware includes basic rate limiting:
- **Default**: 100 requests per 15 minutes per user
- **Identifier**: User ID (if authenticated) or IP address
- **Response**: 429 Too Many Requests with `retryAfter` header

## Security Features

1. **JWT Validation**: All requests validated with JWT tokens
2. **Role-Based Access**: Only ADMIN users can access endpoints
3. **Input Validation**: Request data validated and sanitized
4. **Error Handling**: Comprehensive error responses without sensitive data
5. **Rate Limiting**: Basic protection against abuse
6. **Audit Logging**: All admin actions logged to console

## Development Tips

1. **Testing**: Use Postman or curl for endpoint testing
2. **Debugging**: Check console logs for detailed request/response info
3. **Database**: Ensure PostgreSQL is running and accessible
4. **Environment**: Set JWT_SECRET environment variable
5. **CORS**: Service accepts requests from any origin in development

## Integration with Web Client

The web client's admin dashboard consumes these endpoints via the service client layer:

```typescript
// Example service call from web client
const usersResult = await authService.getUsers({
  page: 1,
  limit: 10,
  search: 'john',
  role: 'USER'
}, token)
```

This maintains proper microservices architecture where the web client acts as a coordinating layer.