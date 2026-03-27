import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectUrl = new URL('/social-accounts', req.nextUrl.origin);

  if (error) {
    console.error('Instagram OAuth Error:', searchParams.get('error_description'));
    redirectUrl.searchParams.set('error', 'instagram_auth_failed');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) {
    redirectUrl.searchParams.set('error', 'invalid_request');
    return NextResponse.redirect(redirectUrl);
  }

  let stateData: { workspaceId: string; nonce: string };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
  } catch (e) {
    redirectUrl.searchParams.set('error', 'invalid_state');
    return NextResponse.redirect(redirectUrl);
  }

  const { workspaceId } = stateData;
  if (!workspaceId) {
    redirectUrl.searchParams.set('error', 'missing_workspace_in_state');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // 3) Exchange code for token
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
        code: code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Failed to exchange code for token:', tokenData);
      throw new Error(tokenData.error_message || 'Token exchange failed');
    }

    const shortLivedToken = tokenData.access_token;
    
    // 4) Fetch user profile
    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(shortLivedToken)}`
    );
    const meData = await meRes.json();
    if (!meRes.ok) {
        console.error('Failed to fetch user profile:', meData);
        throw new Error(meData.error.message || 'Profile fetch failed');
    }

    // 5) Save to Firestore
    const now = new Date().toISOString();
    const accountQuery = await adminFirestore.collection('socialAccounts')
      .where('workspaceId', '==', workspaceId)
      .where('network', '==', 'instagram')
      .where('accountId', '==', meData.id)
      .limit(1).get();

    if (accountQuery.empty) {
        await adminFirestore.collection('socialAccounts').add({
            workspaceId: workspaceId,
            network: 'instagram',
            accountId: meData.id,
            username: meData.username,
            name: meData.username, 
            status: 'connected',
            isPrimary: false, 
            createdAt: now,
            updatedAt: now,
        });
    } else {
        const docRef = accountQuery.docs[0].ref;
        await docRef.update({
            status: 'connected',
            username: meData.username,
            updatedAt: now,
        });
    }
    
    redirectUrl.searchParams.set('status', 'success');
    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error('Instagram callback exception:', err);
    redirectUrl.searchParams.set('error', err.message || 'unknown_error');
    return NextResponse.redirect(redirectUrl);
  }
}
