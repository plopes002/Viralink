import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  if (!workspaceId) {
    return new NextResponse('Workspace ID is required.', { status: 400 });
  }

  const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
  const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
  
  // Scopes for Instagram Basic Display API
  const INSTAGRAM_SCOPES = 'user_profile,user_media';

  const stateData = {
    workspaceId: workspaceId,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
  
  const authUrl =
    'https://api.instagram.com/oauth/authorize' +
    `?client_id=${INSTAGRAM_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI!)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(INSTAGRAM_SCOPES)}` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
