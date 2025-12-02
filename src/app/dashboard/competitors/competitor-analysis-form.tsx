'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, LoaderCircle, AlertTriangle, Users } from 'lucide-react';
import type { AnalyzeCompetitorPostsOutput } from '@/ai/flows/analyze-competitor-posts';

type FormProps = {
  action: (
    prevState: { output: AnalyzeCompetitorPostsOutput | null; error: string | null },
    formData: FormData
  ) => Promise<{ output: AnalyzeCompetitorPostsOutput | null; error: string | null }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="animate-spin mr-2" />
      ) : (
        <Sparkles className="mr-2" />
      )}
      Analyze Posts
    </Button>
  );
}

export default function CompetitorAnalysisForm({ action }: FormProps) {
  const [state, formAction] = useFormState(action, { output: null, error: null });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Analyze Posts</CardTitle>
          <CardDescription>Paste competitor posts below (one per line) to get an AI-powered analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <Textarea
              name="posts"
              placeholder="- Post 1 content...\n- Post 2 content...\n- Post 3 content..."
              className="min-h-[200px]"
              required
            />
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.output && (
        <Card className="animate-in fade-in">
          <CardHeader>
            <CardTitle className="font-headline">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">{state.output.summary}</p>
          </CardContent>
        </Card>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {!state.output && !state.error && (
        <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 font-headline">Analysis Results</h3>
            <p className="text-muted-foreground">
                Your AI-generated competitor analysis will appear here.
            </p>
        </Card>
      )}
    </div>
  );
}
