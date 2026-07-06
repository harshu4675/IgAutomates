import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";

export function useAnalyticsOverview(params = {}) {
  return useQuery({
    queryKey: ["analytics-overview", params],
    queryFn: () => analyticsService.getOverview(params),
    select: (data) => data.data,
    refetchInterval: 30000,
  });
}

export function useRecentActivity(limit = 20, event = null, campaignId = null) {
  return useQuery({
    queryKey: ["recent-activity", limit, event, campaignId],
    queryFn: () => analyticsService.getRecentActivity(limit, event, campaignId),
    select: (data) => data.data || [],
    refetchInterval: 10000,
  });
}

export function useCampaignStats(id, params = {}) {
  return useQuery({
    queryKey: ["campaign-stats", id, params],
    queryFn: () => analyticsService.getCampaignStats(id, params),
    enabled: !!id,
    select: (data) => data.data,
  });
}

export function useHourlyDistribution(params = {}) {
  return useQuery({
    queryKey: ["hourly-distribution", params],
    queryFn: () => analyticsService.getHourlyDistribution(params),
    select: (data) => data.data || [],
  });
}

export function useFunnel(params = {}) {
  return useQuery({
    queryKey: ["conversion-funnel", params],
    queryFn: () => analyticsService.getFunnel(params),
    select: (data) => data.data?.funnel || [],
  });
}
