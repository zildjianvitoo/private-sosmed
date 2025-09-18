import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      displayName: true,
      handle: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile settings</CardTitle>
          <CardDescription>Update how others see you across Serenity Pulse.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            initialValues={{
              displayName: user.displayName,
              handle: user.handle,
              bio: user.bio,
              imageUrl: user.image ? `/${user.image}` : null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
