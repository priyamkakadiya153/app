'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpenCheck, Percent, Bot, PlusCircle, BookCopy } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Class } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { GlowingCard } from '@/components/ui/glowing-card';

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-40 mt-1" />
            </CardContent>
        </Card>
    )
}

const classFormSchema = z.object({
  name: z.string().min(1, 'Class name is required.'),
  description: z.string().min(1, 'Description is required.'),
});

function AddClassDialog({ classesRef }: { classesRef: any }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof classFormSchema>>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  function onSubmit(values: z.infer<typeof classFormSchema>) {
    if (!classesRef || !user) return;
    
    const newClassData = {
        ...values,
        facultyId: user.uid,
    };

    addDocumentNonBlocking(classesRef, newClassData);

    toast({
      title: 'Class Created',
      description: `The class "${values.name}" has been successfully created.`,
    });
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Enter the details for your new class below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS101 Introduction to Programming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief summary of what the class covers." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Class'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const classesRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, 'faculties', user.uid, 'classes');
  }, [firestore, user]);

  const { data: classes, isLoading: isLoadingClasses } = useCollection<Class>(classesRef);

  const totalClasses = classes?.length ?? 0;
  // TODO: Replace with real data from Firestore
  const pendingAssignments = 0;
  const averageSimilarity = 0;
  const aiSuspectedSubmissions = 0;
  const totalAnalyses = 0; // This determines the contextual text


  const isLoading = isLoadingClasses;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your classes and submission analyses."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
            <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </>
        ) : (
            <>
                <GlowingCard>
                  <StatCard title="Total Classes" value={totalClasses} icon={Users} description="Number of courses managed" />
                </GlowingCard>
                <GlowingCard>
                  <StatCard 
                      title="Pending Assignments" 
                      value={pendingAssignments} 
                      icon={BookOpenCheck} 
                      description={totalAnalyses === 0 ? "No submissions to analyze" : `${pendingAssignments} submissions awaiting analysis`}
                  />
                </GlowingCard>
                <GlowingCard>
                  <StatCard 
                      title="Average Similarity" 
                      value={`${averageSimilarity}%`} 
                      icon={Percent} 
                      description={totalAnalyses === 0 ? "No analyses completed yet" : "Across all analyzed submissions"}
                  />
                </GlowingCard>
                <GlowingCard>
                  <StatCard 
                      title="AI-Suspected Submissions" 
                      value={aiSuspectedSubmissions} 
                      icon={Bot} 
                      description={totalAnalyses === 0 ? "No analyses completed yet" : `${aiSuspectedSubmissions} submissions flagged`}
                  />
                </GlowingCard>
            </>
        )}
      </div>

      <GlowingCard>
        <Card>
          <CardHeader>
            <CardTitle className="font-bold">Welcome to CodeSleuth</CardTitle>
            <CardDescription>
              Start by uploading student submissions to analyze code similarity and AI usage.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild size="lg">
                  <Link href="/dashboard/upload">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Start New Analysis
                  </Link>
              </Button>
          </CardContent>
        </Card>
      </GlowingCard>

      <GlowingCard>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-bold">My Classes</CardTitle>
              <CardDescription>Manage your courses and view their assignments.</CardDescription>
            </div>
            <AddClassDialog classesRef={classesRef} />
          </CardHeader>
          <CardContent>
            {isLoadingClasses ? (
              <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
              </div>
            ) : classes && classes.length > 0 ? (
              <div className="divide-y divide-border rounded-md border">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <BookCopy className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">{cls.description}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              {/* TODO: Replace with real data */}
                              <span>Assignments: 0</span>
                              <span className="text-muted-foreground/50">|</span>
                              <span>Last Analysis: Not Run</span>
                          </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/class/${cls.id}`}>View Class</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Classes Found</h3>
                  <p className="text-sm">You haven't created any classes yet.</p>
                  <p className="text-sm mt-1">Click the button above to add your first class.</p>
               </div>
            )}
          </CardContent>
        </Card>
      </GlowingCard>
    </div>
  );
}
