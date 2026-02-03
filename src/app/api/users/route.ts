import { NextRequest, NextResponse } from 'next/server';
import { createUserIfNotExists } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    if (!userData.uid || !userData.email) {
      return NextResponse.json(
        { error: 'User UID and email are required' },
        { status: 400 }
      );
    }

    await createUserIfNotExists(userData);
    
    return NextResponse.json({ success: true });
  } 
  catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}