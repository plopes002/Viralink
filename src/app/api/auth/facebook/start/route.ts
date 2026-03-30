// src/app/api/auth/facebook/start/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_manage_posts",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
].join(",");

function generateNonce(length = 32) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

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

    if (!workspaceId) {
      return new NextResponse('workspaceId is required.', { status: 400 });
    }

    if (!ownerUserId) {
      return new NextResponse('ownerUserId is required.', { status: 400 });
    }

    if (mode !== 'primary' && mode !== 'supporter') {
      return new NextResponse('Invalid mode.', { status: 400 });
    }

    if (mode === 'supporter' && !token) {
      return new NextResponse('token is required for supporter mode.', {
        status: 400,
      });
    }

    const nonce = generateNonce();

    const network =
  searchParams.get('network') === 'facebook' ? 'facebook' : 'instagram';

const accountTypeParam = searchParams.get('accountType');

const accountType =
  accountTypeParam === 'profile' || accountTypeParam === 'page'
    ? accountTypeParam
    : null;

const allowProfile = searchParams.get('allowProfile') === 'true';
const allowPages = searchParams.get('allowPages') === 'true';

const statePayload = {
  workspaceId,
  ownerUserId,
  mode,
  token: token || null,
  network,
  accountType,
  allowProfile,
  allowPages,
  nonce,
};

    const state = Buffer.from(
      JSON.stringify(statePayload),
      'utf8'
    ).toString('base64');

    const authUrl =
      'https://www.facebook.com/v20.0/dialog/oauth' +
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(FACEBOOK_SCOPES)}` +
      `&response_type=code`;
      '&auth_type=rerequest'

    const response = NextResponse.redirect(authUrl);

    response.cookies.set('fb_oauth_nonce', nonce, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10,
      priority: 'high',
    });

    return response;
  } catch (error) {
    console.error('[facebook start] erro:', error);

    return NextResponse.json(
      {
        ok: false,
        message: 'Erro ao iniciar autenticação com Facebook.',
      },
      { status: 500 }
    );
  }
}