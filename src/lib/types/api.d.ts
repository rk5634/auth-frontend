// src/lib/types/api.d.ts

// This interface defines the expected structure for a successful login response from your Go backend.
export interface GoBackendLoginSuccessResponse {
  message: string;
  data: {
    userid: string;
    accesstoken: string;
    email: string;
    role: string;
    deviceid: string;
    // Add any other user details your Go backend provides in the 'data' object.
  };
}

// You can add other common API response patterns here, e.g., for error responses
export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: string;
}

// Define specific API response types for other endpoints as needed
export interface UserProfileResponse {
  message: string;
  data: {
    id: string;
    username: string;
    email: string;
    // ... other profile fields
  };
}