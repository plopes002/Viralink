'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, CalendarPlus, LoaderCircle, AlertTriangle } from 'lucide-react';
import type { GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';
import { useToast } from "@/hooks/use-toast"

type PostGeneratorFormProps = {
  action: (
    prevState: { output: GenerateSocialMediaPostOutput | null; error: string | null },
    formData: FormData
  ) => Promise<{ output: GenerateSocialMediaPostOutput | null; error: string | null }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <LoaderCircle className="animate-spin mr-2" />
      ) : (
        <Sparkles className="mr-2" />
      )}
      Generate Post
    </Button>
  );
}

export default function PostGeneratorForm({ action }: PostGeneratorFormProps) {
  const [state, formAction] = useFormState(action, { output: null, error: null });
  const { toast } = useToast();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: `${type} has been copied.`,
    })
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
        <form action={formAction} className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="theme">Post Theme</Label>
            <Textarea
              id="theme"
              name="theme"
              placeholder="e.g., A new feature launch for a productivity app that helps users manage tasks."
              className="min-h-[120px]"
              required
            />
          </div>
          <SubmitButton />
        </form>
      
      <div>
        {state.output && (
          <Card className="animate-in fade-in">
            <CardHeader>
              <CardTitle className="font-headline">Generated Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Title</Label>
                <p className="text-lg font-bold font-headline">{state.output.title}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Content</Label>
                <p className="text-muted-foreground whitespace-pre-wrap">{state.output.postContent}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Hashtags</Label>
                <p className="text-primary font-medium">{state.output.hashtags}</p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(state.output?.postContent || '', 'Content')}>
                    <Copy className="mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm">
                    <CalendarPlus className="mr-2" /> Schedule
                </Button>
            </CardFooter>
          </Card>
        )}
        {state.error && (
            <Card className="animate-in fade-in bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="font-headline text-destructive flex items-center gap-2">
                        <AlertTriangle />
                        <span>Generation Failed</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{state.error}</p>
                </CardContent>
            </Card>
        )}
        {!state.output && !state.error && (
            <Card className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2 font-headline">Your Post Awaits</h3>
                <p className="text-muted-foreground">
                    Your generated content will appear here once it's ready.
                </p>
            </Card>
        )}
      </div>
    </div>
  );
}
