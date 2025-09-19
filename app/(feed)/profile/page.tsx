import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ProfileOverview } from '@/components/profile/profile-overview';
import { getProfileOverviewData } from '@/lib/queries/profile';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const data = await getProfileOverviewData(session.user.id);

  if (!data) {
    redirect('/login');
  }

  return <ProfileOverview data={data} isSelf />;
}
