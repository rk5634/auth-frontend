import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // your logic
  return NextResponse.json({ message: 'Signup successful' });
}
