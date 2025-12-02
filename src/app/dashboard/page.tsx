'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { StatCard } from '@/components/app/StatCard';
import { Users, ThumbsUp, MessageCircle, CalendarClock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ChartConfig } from '@/components/ui/chart';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: 'Likes',
    color: 'hsl(var(--primary))',
  },
  mobile: {
    label: 'Comments',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

const upcomingPosts = [
    { platform: 'Instagram', content: 'Exciting new feature launch!', status: 'Scheduled', date: '2024-07-25 10:00 AM' },
    { platform: 'Facebook', content: 'Check out our latest blog post on AI marketing...', status: 'Scheduled', date: '2024-07-25 03:00 PM' },
    { platform: 'WhatsApp', content: 'Weekly newsletter broadcast.', status: 'Draft', date: '2024-07-26 09:00 AM' },
    { platform: 'Instagram', content: 'A day in the life at ViralinkAI HQ.', status: 'Scheduled', date: '2024-07-27 12:00 PM' },
];

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader title="Dashboard" description="Welcome back, here's a summary of your social media performance." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Followers" value="12,408" icon={Users} change="+20.1%" changeType="positive" />
        <StatCard title="Engagement Rate" value="2.6%" icon={ThumbsUp} change="+5.2%" changeType="positive" />
        <StatCard title="Messages Received" value="1,245" icon={MessageCircle} change="-2.1%" changeType="negative" />
        <StatCard title="Posts Scheduled" value="32" icon={CalendarClock} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Upcoming Posts</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Platform</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {upcomingPosts.map((post, index) => (
                            <TableRow key={index}>
                                <TableCell>{post.platform}</TableCell>
                                <TableCell className="truncate max-w-[150px]">{post.content}</TableCell>
                                <TableCell>
                                    <Badge variant={post.status === 'Scheduled' ? 'default' : 'secondary'}>
                                        {post.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{post.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
