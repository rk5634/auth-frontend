import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // Used to set cookies on the server-side

// Define the expected structure of the request body for type safety
interface LoginRequestBody {
  email: string;
  password: string;
}

// !!! MODIFIED: Define the expected successful response structure from your Go backend
interface GoBackendLoginSuccessResponse {
  message: string;
  data: { 
    userid: string;
    accesstoken: string; 
    email: string;
    role: string;
    deviceid: string;
    // ... any other user details your Go backend provides
  };
}

// Define the expected error response structure from your Go backend
interface GoBackendErrorResponse {
  message: string;
  statusCode?: number;
  error?: string; // Sometimes a more specific error field
}

// Your Go backend URL from environment variables
const GO_BACKEND_URL = process.env.GO_BACKEND_URL;

// IMPORTANT: This should be the name of the HttpOnly cookie your Go backend sets for the REFRESH TOKEN
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'; // <-- MODIFIED: Renamed and purpose clarified

export async function POST(req: NextRequest) {
  // 1. Validate environment variable
  if (!GO_BACKEND_URL) {
    console.error('GO_BACKEND_URL is not defined in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error.' },
      { status: 500 }
    );
  }
  console.log('login/route - Till here code works', GO_BACKEND_URL); // Log for debugging

  let requestBody: LoginRequestBody;
  try {
    requestBody = await req.json();
  } catch (error: unknown) {
      console.error('Error during login proxy:', error);
      return NextResponse.json(
        { message: 'Internal server error during login.' },
        { status: 500 }
      );
    }

  const { email, password } = requestBody;

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 }
    );
  }

  try {
    // 2. Forward credentials to your Go backend
    const goResponse = await fetch(`${GO_BACKEND_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // 3. Handle Go backend's response
    if (!goResponse.ok) {
      // If Go backend returns an error (e.g., 401 Unauthorized, 400 Bad Request)
      const errorData: GoBackendErrorResponse = await goResponse.json();
      return NextResponse.json(
        { message: errorData.message || 'Authentication failed' },
        { status: goResponse.status }
      );
    }

    // 4. Success: Go backend authenticated.
    // NOW, extract the access token from the body and handle the refresh token cookie.

    const successData: GoBackendLoginSuccessResponse = await goResponse.json();
    const accessToken = successData.data.accesstoken; // <-- EXTRACT ACCESS TOKEN FROM BODY

    if (!accessToken) {
        console.error('Go backend response missing access token in body.');
        return NextResponse.json(
            { message: 'Login successful, but access token missing.' },
            { status: 500 }
        );
    }

    // Create a new NextResponse to send back to the Next.js client
    // Include the access token in the response body to the client
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: successData// Optionally pass other user data
      },
      { status: 200 }
    );

    // Get the Set-Cookie header from the Go backend's response (for refresh token)
    const setCookieHeader = goResponse.headers.get('Set-Cookie');

    if (!setCookieHeader) {
      console.warn('Go backend did not return a Set-Cookie header for the refresh token.');
      // It's up to you if this is a fatal error or just a warning.
      // If the refresh token is crucial for your flow, you might want to return an error.
    } else {
        // Parse the Set-Cookie header and set the refresh token cookie in the Next.js response.
        const cookiesArray = setCookieHeader.split(/, (?=\w+=)/g);
        const refreshTokenCookieString = cookiesArray.find(cookie =>
            cookie.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`)
        );

        if (refreshTokenCookieString) {
            const cookieParts = refreshTokenCookieString.split(';');
            const cookieValue = cookieParts[0].split('=')[1];
            const cookieName = cookieParts[0].split('=')[0];

            // const cookiesObject = cookies(); // No need for await, it's a direct function call for setting

            // Set the refresh token cookie on the Next.js domain
            // Replicate HttpOnly, Secure, SameSite, Path, Expires from your Go backend's refresh token cookie.
            response.cookies.set(cookieName, cookieValue, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Matches Go's conditional secure
                path: '/',
                sameSite: 'strict', // IMPORTANT: Match Go's http.SameSiteStrictMode
                maxAge: 7 * 24 * 60 * 60, // IMPORTANT: Match Go's 7 days in seconds
            });

            console.log(`Successfully set ${cookieName} cookie (refresh token) for Next.js app.`);
        } else {
            console.warn(`Refresh token cookie "${REFRESH_TOKEN_COOKIE_NAME}" not found in Go backend's Set-Cookie header.`);
        }
    }

    console.log('Login proxy successful:', response);
    return response;

  } catch (error) {
    console.error('Error during login proxy:', error);
    return NextResponse.json(
      { message: 'Internal server error during login.' },
      { status: 500 }
    );
  }
}