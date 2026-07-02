import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";

export function useAnalyticsOverview(days = 30) {
  return useQuery({
    queryKey: ["analytics-overview", days],
    queryFn: () => analyticsService.getOverview(days),
    select: (data) => data.data,
    refetchInterval: 30000,
  });
}

export function useRecentActivity(limit = 20, event = null) {
  return useQuery({
    queryKey: ["recent-activity", limit, event],
    queryFn: () => analyticsService.getRecentActivity(limit, event),
    select: (data) => data.data || [],
    refetchInterval: 10000,
  });
}

export function useCampaignStats(id, days = 30) {
  return useQuery({
    queryKey: ["campaign-stats", id, days],
    queryFn: () => analyticsService.getCampaignStats(id, days),
    enabled: !!id,
    select: (data) => data.data,
  });
}

export function useHourlyDistribution(days = 7) {
  return useQuery({
    queryKey: ["hourly-distribution", days],
    queryFn: () => analyticsService.getHourlyDistribution(days),
    select: (data) => data.data || [],
  });
}
