import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const analyticsService = {
  getOverview: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.ANALYTICS.OVERVIEW);
    return response;
  },

  getCampaignStats: async (id) => {
    const response = await axiosInstance.get(
      API_ENDPOINTS.ANALYTICS.CAMPAIGN(id),
    );
    return response;
  },
};
