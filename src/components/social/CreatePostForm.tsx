
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(500, "Post cannot exceed 500 characters."),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostFormProps {
  onCreatePost: (content: string) => Promise<void>;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onCreatePost }) => {
  const { toast } = useToast();
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: PostFormData) => {
    try {
      await onCreatePost(data.content);
      form.reset();
      toast({ title: 'Post Created!', description: 'Your post is now live on your feed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not create post.', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        {...form.register('content')}
        placeholder="What's on your mind?"
        className="bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors"
      />
      {form.formState.errors.content && (
        <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          <Send className="mr-2 h-4 w-4" />
          {form.formState.isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
};

export default CreatePostForm;
