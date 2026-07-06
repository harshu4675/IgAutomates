import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const analyticsService = {
  getOverview: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.OVERVIEW, {
      params,
    });
    return response;
  },

  getRecentActivity: async (limit = 20, event = null, campaignId = null) => {
    const params = { limit };
    if (event) params.event = event;
    if (campaignId) params.campaignId = campaignId;
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.ACTIVITY, {
      params,
    });
    return response;
  },

  getHourlyDistribution: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.HOURLY, {
      params,
    });
    return response;
  },

  getCampaignStats: async (id, params = {}) => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.ANALYTICS.CAMPAIGN(id),
      { params },
    );
    return response;
  },

  getFunnel: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.FUNNEL, {
      params,
    });
    return response;
  },

  exportCSV: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.EXPORT, {
      params,
      responseType: "blob",
    });
    return response;
  },
};
