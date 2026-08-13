import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api/client';
import { UserProfile } from '@/lib/api/types';

export const USER_QUERY_KEY = ['users', 'me'] as const;

export function useCurrentUserQuery() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<UserProfile>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.users.getMe(getToken);
      return response.data;
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 5, 
  });
}
