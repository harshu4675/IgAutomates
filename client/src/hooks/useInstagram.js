import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { instagramService } from "@/services/instagramService";

export function useInstagramAccounts() {
  return useQuery({
    queryKey: ["instagram-accounts"],
    queryFn: instagramService.getAccounts,
    select: (data) => data.data || [],
  });
}

export function useConnectInstagram() {
  return useMutation({
    mutationFn: instagramService.getAuthUrl,
    onSuccess: (data) => {
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    },
  });
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: instagramService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-accounts"] });
    },
  });
}

export function useInstagramPosts(accountId) {
  return useInfiniteQuery({
    queryKey: ["instagram-posts", accountId],
    queryFn: ({ pageParam = null }) =>
      instagramService.getPosts(accountId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.data?.paging?.cursors?.after || undefined,
    enabled: !!accountId,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      posts: data.pages.flatMap((page) => page.data?.posts || []),
    }),
  });
}
