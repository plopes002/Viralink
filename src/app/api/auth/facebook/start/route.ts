import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_manage_comments',
  'instagram_manage_messages',
].join(',');

export async function GET(request: NextRequest) {
  if (!FACEBOOK_APP_ID || !FACEBOOK_REDIRECT_URI) {
    return NextResponse.json(
      { ok: false, message: 'Variáveis do Facebook não configuradas.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return new NextResponse('Workspace ID is required.', { status: 400 });
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const stateData = { workspaceId, nonce };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const authUrl =
    'https://www.facebook.com/v20.0/dialog/oauth' +
    `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
    `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&response_type=code`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('fb_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });

  return res;
}
