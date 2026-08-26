import { NextResponse } from 'next/server';
import { OpenRouterProvider } from '@/lib/ai/openrouter';

export async function GET() {
  try {
    const models = await OpenRouterProvider.fetchFreeModels();
    return NextResponse.json({ models });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch free models' }, { status: 500 });
  }
}
