// src/app/api/auth/facebook/callback/route.ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebaseAdmin';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI!;

type OAuthTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message: string;
    type: string;
    code: number;
  };
};

type PageAccount = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
  };
};

type AccountsResponse = {
  data?: PageAccount[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
};

type InstagramProfileResponse = {
  username?: string;
  id?: string;
  name?: string;
  followers_count?: number;
  media_count?: number;
  error?: {
    message: string;
    type: string;
    code: number;
  };
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const redirectUrl = new URL('/social-accounts', request.nextUrl.origin);

  if (error) {
    console.error('Facebook OAuth Error:', errorDescription);
    redirectUrl.searchParams.set('error', 'facebook_auth_failed');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    redirectUrl.searchParams.set('error', 'invalid_request');
    return NextResponse.redirect(redirectUrl);
  }

  if (!state) {
    redirectUrl.searchParams.set('error', 'missing_state');
    return NextResponse.redirect(redirectUrl);
  }

  const cookieStore = await cookies();
  const savedNonce = cookieStore.get('fb_oauth_nonce')?.value;

  let stateData: { workspaceId: string; nonce: string };

  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
  } catch {
    redirectUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(redirectUrl);
  }

  if (!savedNonce || !stateData.nonce || savedNonce !== stateData.nonce) {
    redirectUrl.searchParams.set('error', 'state_mismatch');
    return NextResponse.redirect(redirectUrl);
  }

  const { workspaceId } = stateData;

  if (!workspaceId) {
    redirectUrl.searchParams.set('error', 'missing_workspace');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const tokenUrl =
      'https://graph.facebook.com/v20.0/oauth/access_token' +
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl, { cache: 'no-store' });
    const tokenData = (await tokenRes.json()) as OAuthTokenResponse;

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error?.message || 'Failed to exchange code for token'
      );
    }

    const userAccessToken = tokenData.access_token;

    const accountsUrl =
      'https://graph.facebook.com/v20.0/me/accounts' +
      `?fields=id,name,access_token,instagram_business_account` +
      `&access_token=${encodeURIComponent(userAccessToken)}`;

    const accountsRes = await fetch(accountsUrl, { cache: 'no-store' });
    const accountsData = (await accountsRes.json()) as AccountsResponse;

    if (!accountsRes.ok || accountsData.error) {
      throw new Error(accountsData.error?.message || 'Failed to list pages');
    }

    const pages = accountsData.data ?? [];
    const pageWithInstagram = pages.find(
      (p) => p.instagram_business_account?.id
    );

    if (!pageWithInstagram?.instagram_business_account?.id) {
      throw new Error(
        'No Instagram Business Account linked to any of your Facebook Pages.'
      );
    }

    const igId = pageWithInstagram.instagram_business_account.id;
    const pageAccessToken = pageWithInstagram.access_token;

    const igProfileUrl =
      `https://graph.facebook.com/v20.0/${encodeURIComponent(igId)}` +
      `?fields=id,username,name,followers_count,media_count` +
      `&access_token=${encodeURIComponent(userAccessToken)}`;

    const igProfileRes = await fetch(igProfileUrl, { cache: 'no-store' });
    const igProfileData =
      (await igProfileRes.json()) as InstagramProfileResponse;

    if (!igProfileRes.ok || igProfileData.error) {
      throw new Error(
        igProfileData.error?.message || 'Failed to fetch Instagram profile'
      );
    }

    const now = new Date().toISOString();

    const accountQuery = await adminFirestore
      .collection('socialAccounts')
      .where('workspaceId', '==', workspaceId)
      .where('network', '==', 'instagram')
      .limit(1)
      .get();
      
    // If no primary exists, make this one primary.
    const primaryQuery = await adminFirestore
      .collection('socialAccounts')
      .where('workspaceId', '==', workspaceId)
      .where('network', '==', 'instagram')
      .where('isPrimary', '==', true)
      .limit(1)
      .get();

    const isPrimary = accountQuery.empty && primaryQuery.empty;

    const payload = {
      workspaceId,
      network: 'instagram' as const,
      accountId: igId,
      username: igProfileData.username || '',
      name: igProfileData.name || igProfileData.username || '',
      status: 'connected' as const,
      followers: igProfileData.followers_count || 0,
      isPrimary,
      accessToken: pageAccessToken || userAccessToken,
      pageAccessToken: pageAccessToken || null,
      updatedAt: now,
    };

    if (accountQuery.empty) {
      await adminFirestore.collection('socialAccounts').add({
        ...payload,
        createdAt: now,
      });
    } else {
      const docRef = accountQuery.docs[0].ref;
      await docRef.update(payload);
    }

    redirectUrl.searchParams.set('status', 'success_instagram');
  } catch (err: any) {
    console.error('Facebook Callback Error:', err);
    redirectUrl.searchParams.set('error', err.message || 'unknown_error');
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set('fb_oauth_nonce', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
