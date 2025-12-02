import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { Download, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <>
      <DashboardHeader
        title="Reports"
        description="Generate and download detailed performance reports."
      >
        <Button>
            <Download className="mr-2" />
            Export PDF/CSV
        </Button>
      </DashboardHeader>
      <Card>
        <CardHeader>
          <CardTitle>Generate a New Report</CardTitle>
          <CardDescription>
            Select your parameters to generate a new performance report.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reporting Unavailable</h3>
          <p className="text-muted-foreground mb-4">
            This feature is currently under development. Check back soon!
          </p>
        </CardContent>
      </Card>
    </>
  );
}
