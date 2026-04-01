import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';

  // Prevent open redirect — only allow relative paths on this origin
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard';

  if (code) {
    const cookiesToSet: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookiesToSet.push(...cookies);
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      for (const { name, value, options } of cookiesToSet) {
        response.cookies.set(name, value, options);
      }
      return response;
    }
  }

  // Return the user to login with an error if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
