import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add database connectivity check here
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Health check failed' }, 
      { status: 500 }
    );
  }
}
