'use client';

import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '@/lib/api/profile';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  handle: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((val) => (val ? /^[a-z0-9_\.\-]{3,30}$/i.test(val) : true), {
      message:
        'Handle must be 3-30 characters and use letters, numbers, underscores, dots, or dashes.',
    }),
  bio: z
    .string()
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((val) => (val ? val.length <= 160 : true), {
      message: 'Bio must be 160 characters or less.',
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileSettingsFormProps {
  initialValues: {
    displayName: string;
    handle: string | null;
    bio: string | null;
    imageUrl: string | null;
  };
}

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialValues.displayName,
      handle: initialValues.handle ?? '',
      bio: initialValues.bio ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const payload = {
        displayName: values.displayName,
        handle: values.handle,
        bio: values.bio,
        avatar: avatarFile,
      };

      return updateProfile(payload);
    },
    onSuccess: async (data) => {
      setErrorMessage(null);
      setAvatarFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      form.reset({
        displayName: data.user.displayName,
        handle: data.user.handle ?? '',
        bio: data.user.bio ?? '',
      });

      await update({
        name: data.user.displayName,
        picture: data.user.image ? `/${data.user.image}` : null,
        handle: data.user.handle ?? null,
      } as unknown as Record<string, unknown>);

      router.refresh();
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    },
  });

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

  const initials = initialValues.displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border/50">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={form.getValues('displayName')} />
            ) : initialValues.imageUrl ? (
              <AvatarImage src={initialValues.imageUrl} alt={form.getValues('displayName')} />
            ) : (
              <AvatarFallback>{initials || 'SP'}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setAvatarFile(file);
              }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Change avatar
              </Button>
              {avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAvatarFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
            {avatarFile && <Badge variant="muted">{avatarFile.name}</Badge>}
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP up to 5MB.</p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl>
                <Input
                  placeholder="yourhandle"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share a short description"
                  rows={4}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset({
                displayName: initialValues.displayName,
                handle: initialValues.handle ?? '',
                bio: initialValues.bio ?? '',
              });
              setAvatarFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            disabled={mutation.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
