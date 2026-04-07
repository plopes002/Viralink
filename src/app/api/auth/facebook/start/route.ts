
// src/app/api/auth/facebook/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_read_user_content",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
].join(",");

export async function GET(request: NextRequest) {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_REDIRECT_URI) {
      return NextResponse.json(
        { ok: false, message: 'Variáveis do Facebook não configuradas.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const ownerUserId = searchParams.get('ownerUserId');
    const mode = searchParams.get('mode') || 'primary';
    const token = searchParams.get('token');
    const accountType = searchParams.get('accountType');
    const allowProfile = searchParams.get('allowProfile') === 'true';
    const allowPages = searchParams.get('allowPages') !== 'false'; // Default to true if not specified

    if (!workspaceId || !ownerUserId) {
      return new NextResponse('workspaceId e ownerUserId são obrigatórios.', { status: 400 });
    }

    const nonce = crypto.randomBytes(16).toString('hex');

    const statePayload = {
      workspaceId,
      ownerUserId,
      mode,
      token: token || null,
      accountType: accountType || null,
      allowProfile,
      allowPages,
      nonce,
    };

    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    const authUrl =
      'https://www.facebook.com/v20.0/dialog/oauth' +
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(FACEBOOK_SCOPES)}` +
      `&response_type=code` +
      `&auth_type=rerequest`;

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('fb_oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('[facebook start] erro:', error);
    return NextResponse.json(
      { ok: false, message: 'Erro ao iniciar autenticação com Facebook.' },
      { status: 500 }
    );
  }
}
