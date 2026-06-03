import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_TOKEN_KEY } from '@/constants/cookies';
import { LARAVEL_ADMIN_API_V1_BASE } from '@/lib/laravelApi';

async function handler(request, context) {
  const params = await context.params;
  const path = params.path.join('/');
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  const jar = await cookies();
  const token = jar.get(ADMIN_TOKEN_KEY)?.value;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const upstreamUrl = `${LARAVEL_ADMIN_API_V1_BASE}/${path}${qs ? '?' + qs : ''}`;

  let body = undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await request.text();
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });

  let data;
  const text = await upstream.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: false, message: `Upstream error ${upstream.status}` };
  }

  const response = NextResponse.json(data, { status: upstream.status });

  if (upstream.status === 401) {
    response.cookies.delete(ADMIN_TOKEN_KEY);
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
