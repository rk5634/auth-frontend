import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // your logic
    let requestBody;
    try {
        requestBody = await req.json();
        console.log('Request body:', requestBody);
    } catch (error: unknown) {
        console.error('Error during signup proxy:', error);
        return NextResponse.json(
            { message: 'Internal server error during signup.' },
            { status: 500 }
        );
    };

  return NextResponse.json({ message: 'Signup successful' });
}
