import { NextResponse } from 'next/server';
import AdminAuthService from '@/services/AdminAuthService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { json, status } = await AdminAuthService.login(body);
    return NextResponse.json(json, { status });
  } catch {
    return NextResponse.json({ success: false, message: 'Login request failed', data: null, errors: null }, { status: 500 });
  }
}
