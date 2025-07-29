# Srinivas Bookshop

A full-stack Node.js bookshop application with JWT authentication, role-based access control, OpenTelemetry tracing, and production-ready deployment configurations.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with admin/user roles
- **Book Management**: Upload books with covers and PDF files (admin only)
- **User Profiles**: Avatar upload with cropping, profile management
- **Observability**: OpenTelemetry 📊 Collector 📈 Jaeger
- **Production Logging**: Winston + Morgan structured logging
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Health Monitoring**: Real-time backend health status
- **Responsive UI**: Mobile-friendly interface with vanilla JavaScript

## 🛠 Tech Stack

- **Runtime**: Node.js v20
- **Backend**: Express 5.1.0, MongoDB (Mongoose), JWT authentication
- **Frontend**: Vanilla HTML/CSS/JavaScript, Cropper.js
- **Observability**: OpenTelemetry 🔍 Collector 🔍 Jaeger
- **Deployment**: Docker + Kubernetes

## 📦 Prerequisites

- Node.js v20+
- Docker & Docker Compose
- Kubernetes (for production deployment)

## 🚀 Quick Start (Local Development)

### Using Docker Compose (Recommended)

1. **Clone and start all services**:
   ```
   git clone <repository-url>
   cd srinivas-bookshop
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger Docs: http://localhost:5000/api-docs
   - Jaeger UI: http://localhost:16686

3. **Create your first admin user**:
   - Go to http://localhost:3000
   - Click "Sign up" and create an account
   - **The first registered user automatically becomes admin**

### Manual Development Setup

1. **Start MongoDB**:
   ```
   docker run -d -p 27017:27017 --name mongo mongo:7
   ```

2. **Start Backend**:
   ```
   cd backend
   npm install
   npm start
   ```

3. **Start Frontend**:
   ```
   cd frontend
   npm install
   npm start
   ```

4. **Start Observability Stack** (optional):
   ```
   docker-compose up otel-collector jaeger
   ```

## 🏗 Production Deployment (Kubernetes)

### 1. Build and Push Images
```
# Build backend image
cd backend
docker build -t your-registry/srinivas-bookshop-backend:latest .
docker push your-registry/srinivas-bookshop-backend:latest

# Build frontend image
cd ../frontend
docker build -t your-registry/srinivas-bookshop-frontend:latest .
docker push your-registry/srinivas-bookshop-frontend:latest
```

### 2. Update Image References
Edit the Kubernetes deployment files to use your registry.

### 3. Deploy to Kubernetes
```
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

### 4. Access Services
```
# Get service URLs
kubectl get services

# Frontend will be available on the LoadBalancer IP:3000
# Backend API on LoadBalancer IP:5000
# Jaeger UI on LoadBalancer IP:16686
```

## 📚 API Documentation

### Authentication Required
All endpoints except `/api/auth/*` require the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

### Key Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/users/me` | Get current user | User |
| PUT | `/api/users/me` | Update profile (multipart) | User |
| GET | `/api/books` | Get all books | User |
| GET | `/api/admin/users` | Get all users | Admin |
| PUT | `/api/admin/users/:id/role` | Update user role | Admin |
| POST | `/api/admin/books` | Create book (multipart) | Admin |
| GET | `/api/health` | Health check | Public |

**Complete API documentation available at**: `http://localhost:5000/api-docs`

## 🔐 User Management

### Promote User to Admin (Manual)
Connect to MongoDB and update user role:
```
// Using MongoDB shell
use srinivas-bookshop
db.users.updateOne(
  { "username": "desired-username" },
  { $set: { "role": "admin" } }
)
```

### Rotate JWT Secret
1. **Generate new secret**:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update configuration**:
   - Docker: Update `JWT_SECRET` in `.env`
   - Kubernetes: Update secret and restart pods.

## 📊 Monitoring & Observability

### Logs
- **Backend logs**: JSON format with timestamps
- **Frontend logs**: All fetch requests/responses in browser console
- **Docker**: `docker-compose logs -f backend`
- **Kubernetes**: `kubectl logs -f deployment/backend-deployment`

### Tracing
1. **Access Jaeger UI**: http://localhost:16686
2. **Search traces**: Service "srinivas-bookshop-backend"
3. **View request flows**: Database queries, HTTP requests, etc.

### Health Checks
- **Backend health**: GET `/api/health`
- **Frontend indicator**: Green/red badge in top navigation
- **Kubernetes probes**: Automatic liveness/readiness checks

## ✅ Testing the Application

### User Registration Flow
1. Visit http://localhost:3000
2. Click "Sign up" → First user becomes admin automatically
3. Register additional users (they become regular users)
4. Login redirects to dashboard (registration does NOT auto-login)

### Admin Features Testing
1. Login as admin user
2. Test "Roles" panel: Change user roles
3. Test "Add Book" panel: Upload book with cover + PDF
4. Test "All Users" panel: Search and view users

### Profile Management
1. Click username in top-right corner
2. Upload and crop avatar image
3. Update profile information
4. Save changes and verify updates