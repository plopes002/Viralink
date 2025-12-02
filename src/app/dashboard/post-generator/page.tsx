'use server';

import { generateSocialMediaPost, GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { Sparkles, Copy, CalendarPlus } from 'lucide-react';
import PostGeneratorForm from './post-generator-form';

async function handleGeneratePost(
  prevState: { output: GenerateSocialMediaPostOutput | null; error: string | null },
  formData: FormData
): Promise<{ output: GenerateSocialMediaPostOutput | null; error: string | null }> {
  const theme = formData.get('theme') as string;

  if (!theme || theme.length < 10) {
    return { output: null, error: 'Please enter a theme with at least 10 characters.' };
  }

  try {
    const output = await generateSocialMediaPost({ theme });
    return { output, error: null };
  } catch (e: any) {
    console.error(e);
    return { output: null, error: e.message || 'An unknown error occurred.' };
  }
}

export default async function PostGeneratorPage() {
  return (
    <>
      <DashboardHeader
        title="AI Post Generator"
        description="Describe a theme and let our AI craft the perfect social media post for you."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="text-primary" />
                <span>Create a new post</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PostGeneratorForm action={handleGeneratePost} />
            </CardContent>
          </Card>
        </div>
        
        <div className="sticky top-8">
          {/* This div will be hydrated by the form action */}
        </div>
      </div>
    </>
  );
}
