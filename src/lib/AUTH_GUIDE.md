# Authentication System Guide

This authentication system is built using TanStack Query and Zustand, providing a robust and scalable solution for user authentication and state management.

## Architecture Overview

### Core Technologies
- **TanStack Query**: Handles API calls, caching, and server state management
- **Zustand**: Manages client-side authentication state
- **TypeScript**: Provides type safety throughout the system

### Key Components

#### 1. Authentication Store (`src/stores/authStore.ts`)
- Manages user authentication state using Zustand
- Persists user data to localStorage
- Provides actions for login, logout, and error handling

#### 2. API Layer (`src/lib/api.ts`)
- Centralized API functions for authentication
- Handles HTTP requests with proper error handling
- Includes token management and request configuration

#### 3. Authentication Hooks (`src/hooks/useAuth.ts`)
- Custom hooks that combine Zustand store with TanStack Query
- Provides mutations for login, signup, sync, and logout
- Handles automatic token verification and refresh

#### 4. UI Components (`src/components/auth/`)
- `LoginForm`: Combined login/signup form with tabs
- `AuthGuard`: Protects routes and shows login when needed
- `UserProfile`: User avatar with profile dropdown
- `SyncButton`: Utility for syncing account with invite codes

## Usage Examples

### Basic Authentication Flow

```tsx
import { useAuth, useLogin, useLogout } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, error } = useAuth();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogin = async () => {
    try {
      await loginMutation.mutateAsync({
        email: 'user@example.com',
        password: 'password123'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Using the Sync Functionality

```tsx
import { useSync } from '@/hooks/useAuth';

function SyncComponent() {
  const syncMutation = useSync();

  const handleSync = async (inviteCode?: string) => {
    try {
      await syncMutation.mutateAsync({ inviteCode });
      console.log('Sync successful');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <button 
      onClick={() => handleSync('invite123')}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? 'Syncing...' : 'Sync Account'}
    </button>
  );
}
```

### Protecting Routes

```tsx
import { AuthGuard } from '@/components/auth/AuthGuard';

function App() {
  return (
    <AuthGuard>
      <ProtectedContent />
    </AuthGuard>
  );
}
```

## API Endpoints

The system expects the following backend endpoints:

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/verify` - Token verification
- `GET /api/auth/profile` - Get user profile

### Sync Endpoint
- `POST /api/sync` - Sync user with invite code

## Configuration

### Environment Variables
Create a `.env` file with:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### API Response Formats

#### Login/Signup Response
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

#### Sync Response
```json
{
  "user": {
    // Updated user object
  },
  "isNewUser": false,
  "message": "Account synced successfully"
}
```

#### Error Response
```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "details": {
    "field": "password"
  }
}
```

## Backend Integration

Your backend should handle the sync endpoint as shown in your example:

```javascript
app.post('/sync', optionalProviderAuthMiddleware, async (req, res) => {
  let invite;
  if (req.body.inviteCode) {
    invite = await inviteController.get(req.body.inviteCode);
  }
  const inviteExists = !!invite;

  if (req.user.id) {
    if (inviteExists) {
      await inviteController.syncExistingUser(req.user.id, invite);
    }
    return res.json(await syncResponse(false)).end();
  }

  if (!inviteExists && !env.ALLOW_SIGNUP) {
    throw new UnauthorizedError('SIGNUP_DISABLED', 'No registered account was found and signup is disabled.');
  }

  // Handle new user registration with invite
  // ... rest of your logic
});
```

## Features

### ✅ Implemented
- User login and signup
- Persistent authentication state
- Automatic token verification
- User profile management
- Account syncing with invite codes
- Protected routes with AuthGuard
- Comprehensive error handling
- TypeScript support throughout

### 🔄 Extensible
- Token refresh mechanism
- User profile updates
- Password reset functionality
- Social authentication
- Multi-factor authentication

## Security Considerations

1. **Token Storage**: JWT tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Token Verification**: Automatic background verification of authentication state
3. **Error Handling**: Proper error boundaries and user feedback
4. **Route Protection**: AuthGuard component prevents unauthorized access

## Testing

The system is designed to be easily testable:
- Zustand store can be tested in isolation
- API functions are pure and mockable
- React Query provides built-in testing utilities
- Components use standard React testing patterns

## Performance

- **Caching**: TanStack Query handles intelligent caching of user data
- **Optimistic Updates**: Immediate UI updates with background sync
- **Background Refresh**: Automatic token verification without blocking UI
- **Persistence**: User state persists across browser sessions
