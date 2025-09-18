export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    handle: string | null;
  };
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Unable to create account');
  }

  return response.json();
}
