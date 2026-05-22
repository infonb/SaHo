# React Frontend - Spring Boot Backend Integration Guide

## Integration Summary

The React frontend (Vite - port 3000/5173) is now fully integrated with the Spring Boot backend (port 8080) for Sponsor management APIs.

## What Was Implemented

### 1. **Frontend - Axios API Service** (`src/api/sponsorApi.ts`)
- ✅ Created real API service using Axios
- ✅ Configured API base URL: `http://localhost:8080/api`
- ✅ Implemented all sponsor endpoints:
  - `POST /sponsors` - Create/Update sponsor
  - `GET /sponsors` - Get all sponsors (with pagination)
  - `GET /sponsors/{id}` - Get sponsor by ID
  - `DELETE /sponsors/{id}` - Deactivate sponsor
- ✅ Added data mapping between frontend and backend formats
- ✅ Proper error handling with console logging
- ✅ User ID management via `setCurrentUserId()` function

### 2. **Backend - CORS Configuration** (`config/WebConfig.java`)
- ✅ Created `WebConfig` class implementing `WebMvcConfigurer`
- ✅ Configured CORS to allow requests from localhost on any port
- ✅ Allowed methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- ✅ Set credentials support and preflight caching (1 hour)

### 3. **Form Integration** (`src/pages/Sponsors/SponsorFormPage.tsx`)
- ✅ Updated to initialize user ID from authentication context
- ✅ Form now calls real backend APIs on submit
- ✅ Loading states managed during API calls
- ✅ Error states and success messages implemented
- ✅ Existing UI design preserved

## Field Mapping

### Frontend → Backend DTO Mapping

| Frontend Form Field | Backend Request Field | Type | Notes |
|---|---|---|---|
| `name` | `sponsorName` | String | Main sponsor name |
| `email` | `email` | String | Email address |
| `dob` | `dob` | String (YYYY-MM-DD) | Date of birth |
| `ph_no` | `phNo` | String | Phone number |
| `type` | `sponsorType` | Enum | 'Individual' or 'Organisation' |
| `nationality` | `nationality` | String | Nationality |
| `contrib_amt` | `contrib` | String (BigDecimal) | Contribution amount |
| `loc` | `loc` | String | Location |
| `image_url` | *(separate)* | - | Image handling separate from sponsor data |
| `created_by` | `createdBy` | Number | Mapped from user_id via context |

### Backend Request DTO Structure
```typescript
{
  sponsorId?: number;           // For updates only
  sponsorName: string;          // Required
  email: string;                // Required
  dob: string;                  // YYYY-MM-DD format
  phNo: string;                 // Required
  sponsorType: string;          // 'Individual' or 'Organisation'
  nationality: string;          // Required
  contrib: string;              // BigDecimal as string
  loc?: string;                 // Optional location
  createdBy?: number;           // User ID (set from context)
  modifiedBy?: number;          // For updates
}
```

## Setup Instructions

### Prerequisites
- Java 11+ (Spring Boot backend)
- Node.js 16+ (React frontend)
- PostgreSQL running with SaHo database

### Backend Setup

1. **Database Configuration** (already set)
   - URL: `jdbc:postgresql://192.168.2.24:5432/SaHo`
   - Username: `postgres`
   - Password: `1234`

2. **Start Spring Boot Server**
   ```bash
   cd backend/saho-foundation-backend
   mvn clean install
   mvn spring-boot:run
   # Server runs on http://localhost:8080
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend/saho-admin
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # Dev server typically runs on http://localhost:5173
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Testing the Integration

### 1. Test Add Sponsor Flow
- Navigate to `/sponsors/add` in the admin panel
- Fill in all required fields:
  - Name, Email, Date of Birth, Phone Number, Nationality, Contribution, Type
- Upload or capture a photo (optional)
- Click "Add Sponsor"
- Should see success message and navigate back to sponsors list

### 2. Test Edit Sponsor Flow
- Click "Edit" on any sponsor from the list
- Modify any field
- Click "Save Changes"
- Should see success message

### 3. Test Delete Sponsor Flow
- Select one or more sponsors from the list
- Click "Delete" button
- Confirm deletion
- Sponsors should be deactivated

### 4. Browser DevTools - Network Tab
When adding/editing a sponsor, check the Network tab:
- **Request URL**: `http://localhost:8080/api/sponsors`
- **Method**: `POST`
- **Headers**: Should include CORS headers
- **Payload**: Backend DTO format with proper field names
- **Response**: 200 OK with success message

### 5. Backend Logs
- Check Spring Boot console for SQL logs
- Should see sponsor data being saved to PostgreSQL
- Check for any validation errors

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Sponsor saved successfully",
  "data": null
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Important Notes

### User ID Handling
- User ID is automatically set from authentication context
- Set via `setCurrentUserId()` when component mounts
- Stored in module-level variable for API calls
- Fallback to ID `1` if user context unavailable

### CORS Configuration
- Configured for `localhost:*` (all localhost ports)
- Allows credentials in requests
- Preflight requests cached for 1 hour
- Supports all standard HTTP methods

### Error Handling
- All API errors logged to console
- Form displays toast messages on success/failure
- Loading states prevent duplicate submissions
- Navigation on successful submission

### Image Upload
- Currently handled separately from sponsor creation
- Images stored as blob URLs during form editing
- Backend integration for image storage can be added later
- Size validation: 5KB to 1MB

## Potential Issues & Solutions

### Issue 1: CORS Error
**Error**: `Access to XMLHttpRequest blocked by CORS policy`
**Solution**: 
- Verify `WebConfig.java` is deployed
- Check Spring Boot is running on port 8080
- Restart backend after deploying CORS config

### Issue 2: 404 Not Found
**Error**: `404 POST /api/sponsors`
**Solution**:
- Verify backend is running: `http://localhost:8080/api/sponsors`
- Check SponsorController is properly annotated
- Check application.properties server port

### Issue 3: Database Connection Error
**Error**: `Unable to connect to database`
**Solution**:
- Verify PostgreSQL is running
- Check database credentials in `application.properties`
- Verify database `SaHo` exists with proper schema

### Issue 4: 400 Bad Request
**Error**: `400 Bad Request`
**Solution**:
- Check field names match backend DTO exactly
- Verify date format is YYYY-MM-DD
- Check contribution amount is numeric string
- Validate required fields are not empty

## Environment Variables

### Frontend
- Base API URL: Hardcoded to `http://localhost:8080/api`
- Can be moved to `.env` file for production:
  ```
  VITE_API_BASE_URL=http://localhost:8080/api
  ```

### Backend
- Server Port: `8080` (configured in `application.properties`)
- Database URL: `jdbc:postgresql://192.168.2.24:5432/SaHo`
- Credentials: Username `postgres`, Password `1234`

## Next Steps

### 1. Image Upload Integration
- Create endpoint for image upload in Spring Boot
- Return image URL from create/update response
- Store images in database or cloud storage

### 2. Authentication & Authorization
- Implement JWT token-based authentication
- Add Bearer token to API headers
- Validate user permissions on backend

### 3. Input Validation
- Add client-side validation for form fields
- Add server-side validation in Spring Boot DTOs
- Implement custom validation annotations

### 4. API Error Handling
- Create global exception handler in Spring Boot
- Return standardized error responses
- Add specific HTTP status codes

### 5. Production Deployment
- Use environment-based configuration
- Implement API gateway for routing
- Add API rate limiting
- Set up monitoring and logging

## File References

### Created Files
- `backend/saho-foundation-backend/src/main/java/com/saho/foundation/config/WebConfig.java`

### Modified Files
- `frontend/saho-admin/src/api/sponsorApi.ts`
- `frontend/saho-admin/src/pages/Sponsors/SponsorFormPage.tsx`

### Configuration Files
- Backend: `src/main/resources/application.properties` (no changes needed)
- Frontend: `package.json` (Axios already installed as dependency)

## Verification Checklist

- [x] CORS configuration created in backend
- [x] API service updated to use Axios
- [x] Field mapping implemented correctly
- [x] User ID integration from auth context
- [x] Error handling implemented
- [x] Loading states managed
- [x] TypeScript types defined
- [x] No TypeScript compilation errors
- [x] Console logging for debugging
- [x] Existing UI design preserved

## Support & Debugging

### Enable Debug Logging

**Frontend**: Check browser console (F12)
- API requests visible in Network tab
- Errors logged to console
- Add more logs in sponsorApi.ts as needed

**Backend**: Check Spring Boot console
- SQL logs showing database operations
- Controller method logs
- Exception stack traces

### Common Log Messages

**Success**:
```
Sponsor created successfully: Sponsor saved successfully
```

**Error**:
```
Failed to create sponsor: Error: Request failed with status code 400
```
