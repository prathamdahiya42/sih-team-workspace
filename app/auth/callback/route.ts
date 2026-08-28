import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/teams';

  // 1. If Supabase Auth redirected with an error (e.g. expired link)
  if (error || errorDescription) {
    const message = encodeURIComponent(errorDescription || error || 'Authentication link failed');
    return NextResponse.redirect(`${origin}/auth/login?error=${message}`);
  }

  // 2. Exchange authorization code for authenticated session
  if (code) {
    const supabase = createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const message = encodeURIComponent(exchangeError.message || 'Could not verify confirmation code');
    return NextResponse.redirect(`${origin}/auth/login?error=${message}`);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Invalid%20or%20missing%20authentication%20code`);
}
