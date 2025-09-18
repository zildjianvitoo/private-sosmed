'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Camera, Plus, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface PostComposerProps {
  currentUser: {
    id: string;
    displayName: string;
    handle: string | null;
    image: string | null;
  } | null;
}

export function PostComposer({ currentUser }: PostComposerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = Boolean(currentUser);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Sign in to publish a photo.');
      }

      if (!file) {
        throw new Error('Choose an image to upload.');
      }
      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to upload photo');
      }

      return response.json();
    },
    onSuccess: () => {
      setCaption('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    },
  });

  const initials = currentUser?.displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/30 bg-background/80 p-4 shadow-inner">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border border-border/60">
          {currentUser?.image ? (
            <AvatarImage src={currentUser.image} alt={currentUser.displayName} />
          ) : (
            <AvatarFallback>{initials || 'SP'}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <Input
            placeholder="Tell your friends what's new"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            className="bg-background/60"
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setFile(selected ?? null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isAuthenticated || mutation.isPending}
          >
            <Camera className="mr-2 h-4 w-4" />
            {file ? 'Change image' : 'Add photo'}
          </Button>
          {file && <Badge variant="muted">{file.name}</Badge>}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="soft" size="sm" className="hidden sm:inline-flex" disabled>
            <Sparkles className="mr-2 h-4 w-4" /> Inspire me
          </Button>
          <Button
            disabled={mutation.isPending || !file || !isAuthenticated}
            onClick={() => mutation.mutate()}
            className="whitespace-nowrap"
          >
            {mutation.isPending ? (
              'Uploading…'
            ) : isAuthenticated ? (
              <>
                <Plus className="mr-2 h-4 w-4" /> Publish post
              </>
            ) : (
              'Sign in to post'
            )}
          </Button>
        </div>
      </div>

      <Separator />
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Badge variant="muted">Add tags</Badge>
        <Badge variant="muted">Schedule</Badge>
        <Badge variant="muted">Share to stories</Badge>
      </div>
    </div>
  );
}
