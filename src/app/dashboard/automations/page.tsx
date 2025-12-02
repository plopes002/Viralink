'use server';

import { classifyAutomateMessages, ClassifyAutomateMessagesOutput } from '@/ai/flows/classify-automate-messages';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AutomationsForm from './automations-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, BotMessageSquare } from 'lucide-react';

async function handleClassifyMessage(
  prevState: { output: ClassifyAutomateMessagesOutput | null; error: string | null },
  formData: FormData
): Promise<{ output: ClassifyAutomateMessagesOutput | null; error: string | null }> {
  const message = formData.get('message') as string;
  if (!message) {
    return { output: null, error: 'Please enter a message to classify.' };
  }

  try {
    const output = await classifyAutomateMessages({ message });
    return { output, error: null };
  } catch (e: any) {
    console.error(e);
    return { output: null, error: e.message || 'An unknown error occurred.' };
  }
}

export default async function AutomationsPage() {
  return (
    <>
      <DashboardHeader
        title="Automations"
        description="Create rules and use AI to automate your message replies."
      >
        <Button>
          <PlusCircle className="mr-2" />
          New Rule
        </Button>
      </DashboardHeader>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AutomationsForm action={handleClassifyMessage} />
        </div>
        <div className="space-y-8">
           <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Automation Rules</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
                    <BotMessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Rules Yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first automation rule to get started.
                    </p>
                    <Button>
                        <PlusCircle className="mr-2" />
                        New Rule
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
