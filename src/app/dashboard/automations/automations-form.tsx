'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, LoaderCircle, AlertTriangle, BotMessageSquare } from 'lucide-react';
import type { ClassifyAutomateMessagesOutput } from '@/ai/flows/classify-automate-messages';
import { Badge } from '@/components/ui/badge';

type FormProps = {
  action: (
    prevState: { output: ClassifyAutomateMessagesOutput | null; error: string | null },
    formData: FormData
  ) => Promise<{ output: ClassifyAutomateMessagesOutput | null; error: string | null }>;
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
      Classify & Reply
    </Button>
  );
}

export default function AutomationsForm({ action }: FormProps) {
  const [state, formAction] = useFormState(action, { output: null, error: null });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Test AI Replies</CardTitle>
          <CardDescription>Enter a sample message to see how the AI classifies it and suggests a reply.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Sample Message</Label>
                <Input
                name="message"
                id="message"
                placeholder="e.g., 'I love your new update! It's amazing.'"
                required
                />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.output && (
        <Card className="animate-in fade-in">
          <CardHeader>
            <CardTitle className="font-headline">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Classification</Label>
              <div className="mt-1">
                <Badge>{state.output.classification}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Suggested Automated Reply</Label>
              <p className="text-muted-foreground whitespace-pre-wrap border p-3 rounded-md mt-1 bg-secondary/50">{state.output.automatedReply}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Processing Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {!state.output && !state.error && (
        <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed">
            <BotMessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 font-headline">AI Results</h3>
            <p className="text-muted-foreground">
                The message classification and suggested reply will appear here.
            </p>
        </Card>
      )}
    </div>
  );
}
