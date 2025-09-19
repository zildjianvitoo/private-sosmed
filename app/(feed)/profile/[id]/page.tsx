import { notFound, redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ProfileOverview } from '@/components/profile/profile-overview';
import { getProfileOverviewData } from '@/lib/queries/profile';

interface ProfilePageProps {
  params: { id: string };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const data = await getProfileOverviewData(params.id);

  if (!data) {
    notFound();
  }

  const isSelf = session.user.id === params.id;

  return <ProfileOverview data={data} isSelf={isSelf} />;
}
