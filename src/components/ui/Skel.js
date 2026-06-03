'use client';

export default function Skel({ w = 'w-full', h = 'h-4' }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${w} ${h}`} />;
}
