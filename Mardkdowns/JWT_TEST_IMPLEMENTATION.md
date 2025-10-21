# JWT-Based Test Authentication Implementation

## Overview

This implementation provides a secure, JWT-based authentication system for student test participation with automatic token invalidation.

## Environment Variables Required

Add to your `.env.local` file:

```bash
# JWT Secret for test authentication tokens
TEST_JWT_SECRET=your-super-secure-random-key-here

# Existing variables (if not already present)
CRON_SECRET=your-cron-secret-key
```

## Key Components

### 1. JWT Verification Library (`src/lib/verifyTestToken.ts`)

- Verifies JWT tokens with database validation
- Checks token expiration against test due date + 1 minute
- Validates student verification status in TestAccess table
- Generates secure JWT tokens for verified students

### 2. Updated APIs

#### Verification API (`/api/tests/public/[shareToken]/verify`)

- Returns JWT token after successful DB verification
- Token expires at test due date + 1 minute

#### Test Submission API (`/api/tests/[id]/responses`)

- Accepts both standard authentication and JWT tokens
- Validates JWT tokens before processing submissions

#### Test Cancellation API (`/api/tests/[testId]/cancel`)

- Invalidates test access in database
- Requires valid JWT token for cancellation

### 3. Frontend Updates

#### Verification Page (`/student/test/verify/[shareToken]`)

- Stores JWT token in sessionStorage
- Auto-redirects to test page after verification

#### Test Page (`/student/test/[shareToken]`)

- Uses JWT token for API authentication
- Includes cancel test functionality with confirmation modal
- Clears tokens after successful submission or cancellation

### 4. Automatic Token Invalidation

#### Cron Job (`/api/cron/deactivate-expired-links`)

- Runs periodically to invalidate expired test accesses
- Sets `verified: false` for expired TestAccess records
- Can be triggered manually or via scheduled cron

## Security Features

1. **JWT Expiration**: Tokens expire exactly 1 minute after test due date
2. **Database Validation**: Every token verification checks current DB state
3. **Session Storage**: Tokens stored in sessionStorage (not localStorage)
4. **Automatic Cleanup**: Expired tokens invalidated via background job
5. **Token Blacklisting**: Ready for implementation with Redis/DB blacklist

## Usage Flow

1. Student visits test verification page
2. Enters matric number and password
3. System validates against database
4. JWT token generated and stored in sessionStorage
5. Student redirected to test page
6. All test API calls include JWT token in Authorization header
7. Token automatically invalidated after test due date + 1 minute

## Testing

To test the implementation:

1. Set `TEST_JWT_SECRET` in your environment
2. Create a test with a due date
3. Verify student can authenticate and receive JWT token
4. Confirm test submission works with JWT token
5. Test cancellation functionality
6. Verify token invalidation after due date

## Production Considerations

1. Use a strong, random `TEST_JWT_SECRET`
2. Set up cron job to run every 5-10 minutes
3. Consider implementing token blacklisting for enhanced security
4. Monitor token usage and expiration patterns
5. Add logging for security events
