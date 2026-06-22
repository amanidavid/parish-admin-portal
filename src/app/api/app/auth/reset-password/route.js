import { NextResponse } from 'next/server';
import { LARAVEL_API_V1_BASE } from '@/lib/laravelApi';

export async function POST(request) {
  try {
    const body = await request.json();
    const res = await fetch(`${LARAVEL_API_V1_BASE}/app/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({
      success: false,
      message: 'Invalid server response',
      data: null,
    }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Request failed. Please try again.', data: null },
      { status: 500 }
    );
  }
}
