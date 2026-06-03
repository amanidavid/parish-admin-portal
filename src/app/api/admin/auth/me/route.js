import { NextResponse } from 'next/server';
import AdminAuthService from '@/services/AdminAuthService';

export async function GET() {
  try {
    const { json, status } = await AdminAuthService.me();
    return NextResponse.json(json, { status });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to fetch admin profile', data: null }, { status: 500 });
  }
}
