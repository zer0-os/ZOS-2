# API Layer

A well-structured, production-ready API layer for the application.

## Structure

```
src/api/
├── client.ts          # Base API client with common functionality
├── services/
│   ├── auth.ts        # Authentication service
│   └── user.ts        # User management service
├── index.ts           # Main exports and API aggregation
└── README.md          # This file
```

## Usage

### Basic Usage

```typescript
import { api } from '@/api';

// Authentication
const loginResponse = await api.auth.login({ email, password });
const user = await api.user.getProfile(token);

// Or use individual services
import { authService, userService } from '@/api';
```

### Legacy Compatibility

For gradual migration, legacy imports are still supported:

```typescript
// Still works (but deprecated)
import { authApi } from '@/api';
```

## Key Benefits

1. **Separation of Concerns**: Each service handles a specific domain
2. **Type Safety**: Full TypeScript support with proper typing
3. **Error Handling**: Consistent error handling across all API calls
4. **Testing**: Easy to mock individual services
5. **Scalability**: Easy to add new services as the app grows
6. **Maintainability**: Clear structure and single responsibility

## Services

### AuthService (`api.auth`)
- `login(credentials)` - User authentication
- `signup(credentials)` - User registration  
- `logout()` - User logout
- `refreshToken()` - Token refresh
- `verifyToken()` - Token verification
- `sync(data)` - Data synchronization

### UserService (`api.user`)
- `getProfile(token)` - Get current user profile
- `getUserByZid(zid)` - Get user by Zero ID
- `updateProfile(data, token)` - Update user profile

## Error Handling

All services use the `ApiError` class for consistent error handling:

```typescript
try {
  await api.auth.login(credentials);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.status, error.code, error.message);
  }
}
```

## Adding New Services

1. Create a new service file in `src/api/services/`
2. Export the service from `src/api/index.ts`
3. Add to the `api` object for convenient access
