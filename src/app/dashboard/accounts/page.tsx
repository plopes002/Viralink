import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { PlusCircle } from 'lucide-react';

export default function AccountsPage() {
  return (
    <>
      <DashboardHeader
        title="Social Accounts"
        description="Manage your connected social media profiles."
      >
        <Button>
          <PlusCircle className="mr-2" />
          Connect Account
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            You have no social accounts connected yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <Share2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your First Account</h3>
          <p className="text-muted-foreground mb-4">
            Link your Instagram, Facebook, or WhatsApp to get started.
          </p>
          <Button>
            <PlusCircle className="mr-2" />
            Connect Account
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
