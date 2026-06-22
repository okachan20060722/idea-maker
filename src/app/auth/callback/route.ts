import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // adjust based on actual path or use relative
// Let's use relative to be safe
import { createClient as createServerClient } from '../../../lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=true`);
}
