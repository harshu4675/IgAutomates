import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function usePrefetch(queryKey, queryFn, options = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options.staleTime || 5 * 60 * 1000,
    });
  }, [queryClient, queryKey, queryFn, options.staleTime]);
}

export function usePrefetchOnHover() {
  const queryClient = useQueryClient();

  return (queryKey, queryFn, options = {}) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options.staleTime || 5 * 60 * 1000,
    });
  };
}
