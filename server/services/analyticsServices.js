import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const analyticsService = {
  getOverview: async (days = 30) => {
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.ANALYTICS.OVERVIEW}?days=${days}`,
    );
    return response;
  },

  getRecentActivity: async (limit = 20, event = null) => {
    let url = `/analytics/activity?limit=${limit}`;
    if (event) url += `&event=${event}`;
    const response = await axiosInstance.get(url);
    return response;
  },

  getCampaignStats: async (id, days = 30) => {
    const response = await axiosInstance.get(
      `${API_ENDPOINTS.ANALYTICS.CAMPAIGN(id)}?days=${days}`,
    );
    return response;
  },

  getHourlyDistribution: async (days = 7) => {
    const response = await axiosInstance.get(`/analytics/hourly?days=${days}`);
    return response;
  },
};
