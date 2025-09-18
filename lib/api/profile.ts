export interface ProfileUpdatePayload {
  displayName: string;
  handle?: string | null;
  bio?: string | null;
  avatar?: File | null;
}

export interface ProfileResponse {
  user: {
    id: string;
    displayName: string;
    handle: string | null;
    bio: string | null;
    image: string | null;
  };
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<ProfileResponse> {
  const formData = new FormData();
  formData.append('displayName', payload.displayName);
  if (payload.handle !== undefined) {
    formData.append('handle', payload.handle ?? '');
  }
  if (payload.bio !== undefined) {
    formData.append('bio', payload.bio ?? '');
  }
  if (payload.avatar) {
    formData.append('avatar', payload.avatar);
  }

  const response = await fetch('/api/profile', {
    method: 'PATCH',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Failed to update profile');
  }

  return response.json();
}
