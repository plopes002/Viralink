'use server';

import { analyzeCompetitorPosts, AnalyzeCompetitorPostsOutput } from '@/ai/flows/analyze-competitor-posts';
import { DashboardHeader } from '@/components/app/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CompetitorAnalysisForm from './competitor-analysis-form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

async function handleAnalyzePosts(
  prevState: { output: AnalyzeCompetitorPostsOutput | null; error: string | null },
  formData: FormData
): Promise<{ output: AnalyzeCompetitorPostsOutput | null; error: string | null }> {
  const postsRaw = formData.get('posts') as string;
  if (!postsRaw) {
    return { output: null, error: 'Please paste at least one competitor post.' };
  }
  const posts = postsRaw.split('\n').filter(p => p.trim() !== '');

  if (posts.length === 0) {
    return { output: null, error: 'Please paste at least one competitor post.' };
  }

  try {
    const output = await analyzeCompetitorPosts({ posts });
    return { output, error: null };
  } catch (e: any) {
    console.error(e);
    return { output: null, error: e.message || 'An unknown error occurred during analysis.' };
  }
}

const trackedCompetitors = [
    { name: 'SocialFlow', handle: '@socialflow', followers: '125K' },
    { name: 'Buffer', handle: '@buffer', followers: '1.1M' },
    { name: 'Sprout Social', handle: '@sproutsocial', followers: '340K' },
];

export default async function CompetitorsPage() {
  return (
    <>
      <DashboardHeader
        title="Competitor Analysis"
        description="Analyze competitor posts to gain insights and refine your strategy."
      >
        <Button>
            <PlusCircle className="mr-2" />
            Track Competitor
        </Button>
      </DashboardHeader>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <CompetitorAnalysisForm action={handleAnalyzePosts} />
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Tracked Competitors</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Competitor</TableHead>
                                <TableHead>Followers</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {trackedCompetitors.map(c => (
                                <TableRow key={c.handle}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`https://i.pravatar.cc/40?u=${c.handle}`} />
                                                <AvatarFallback>{c.name.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-xs text-muted-foreground">{c.handle}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{c.followers}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
