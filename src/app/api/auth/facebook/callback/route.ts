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
  user_id?: string;
  account_type?: string;
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

  const cookieStore = cookies();
  const savedNonce = cookieStore.get('fb_oauth_nonce')?.value;

  let stateData: { workspaceId: string; nonce: string };
  try {
    stateData = JSON.parse(Buffer.from(state!, 'base64').toString('utf8'));
  } catch (e) {
    redirectUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(redirectUrl);
  }
  
  if (!savedNonce || !stateData.nonce || savedNonce !== stateData.nonce) {
    redirectUrl.searchParams.set('error', 'state_mismatch');
    return NextResponse.redirect(redirectUrl);
  }

  const { workspaceId } = stateData;

  try {
    // 1) troca code por user access token
    const tokenUrl =
      'https://graph.facebook.com/v20.0/oauth/access_token' +
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}` +
      `&client_secret=${encodeURIComponent(FACEBOOK_APP_SECRET)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl, { cache: 'no-store' });
    const tokenData = (await tokenRes.json()) as OAuthTokenResponse;

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code for token');
    }

    const userAccessToken = tokenData.access_token;

    // 2) lista páginas e traz instagram_business_account
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
    const pageWithInstagram = pages.find((p) => p.instagram_business_account?.id);

    if (!pageWithInstagram?.instagram_business_account?.id) {
      throw new Error('No Instagram Business Account linked to any of your Facebook Pages.');
    }

    const igId = pageWithInstagram.instagram_business_account.id;

    // 3) lê dados básicos da conta Instagram
    const igProfileUrl =
      `https://graph.facebook.com/v20.0/${encodeURIComponent(igId)}` +
      `?fields=id,username,account_type,media_count` +
      `&access_token=${encodeURIComponent(userAccessToken)}`;

    const igProfileRes = await fetch(igProfileUrl, { cache: 'no-store' });
    const igProfileData = (await igProfileRes.json()) as InstagramProfileResponse;

    if (!igProfileRes.ok || igProfileData.error) {
      throw new Error(igProfileData.error?.message || 'Failed to fetch Instagram profile');
    }

    // 4) Salva no Firestore
    const now = new Date().toISOString();
    const accountQuery = await adminFirestore.collection('socialAccounts')
      .where('workspaceId', '==', workspaceId)
      .where('network', '==', 'instagram')
      .where('accountId', '==', igId)
      .limit(1).get();

    if (accountQuery.empty) {
        await adminFirestore.collection('socialAccounts').add({
            workspaceId: workspaceId,
            network: 'instagram',
            accountId: igId,
            username: igProfileData.username,
            name: igProfileData.username, 
            status: 'connected',
            isPrimary: false,
            createdAt: now,
            updatedAt: now,
        });
    } else {
        const docRef = accountQuery.docs[0].ref;
        await docRef.update({
            status: 'connected',
            username: igProfileData.username,
            name: igProfileData.username,
            updatedAt: now,
        });
    }

    redirectUrl.searchParams.set('status', 'success_instagram');

  } catch (err: any) {
    console.error("Facebook Callback Error:", err);
    redirectUrl.searchParams.set('error', err.message || 'unknown_error');
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set('fb_oauth_nonce', '', { maxAge: -1 }); // Clear cookie
  return response;
}
