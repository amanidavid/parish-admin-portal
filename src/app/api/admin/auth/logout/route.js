import { NextResponse } from 'next/server';
import AdminAuthService from '@/services/AdminAuthService';

export async function POST() {
  try {
    await AdminAuthService.logout();
    return NextResponse.json({ success: true, message: 'Logged out successfully', data: null });
  } catch {
    return NextResponse.json({ success: false, message: 'Logout request failed', data: null }, { status: 500 });
  }
}
