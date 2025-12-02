import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { PlusCircle } from 'lucide-react';

export default function SchedulerPage() {
  return (
    <>
      <DashboardHeader
        title="Content Scheduler"
        description="Plan and visualize your social media content calendar."
      >
        <Button>
            <PlusCircle className="mr-2" />
            Schedule Post
        </Button>
      </DashboardHeader>
      <Card>
        <CardContent className="p-2 md:p-4">
            <Calendar
                mode="single"
                className="p-0 [&_td]:w-full [&_tr]:w-full"
            />
        </CardContent>
      </Card>
    </>
  );
}
