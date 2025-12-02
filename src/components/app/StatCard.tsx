import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative';
};

export function StatCard({ title, value, icon: Icon, change, changeType }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${changeType === 'positive' ? 'text-accent-foreground' : 'text-destructive'}`}>
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
