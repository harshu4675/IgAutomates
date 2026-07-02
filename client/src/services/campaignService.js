import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const campaignService = {
  getAll: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.CAMPAIGNS.BASE);
    return response;
  },

  getById: async (id) => {
    const response = await axiosInstance.get(API_ENDPOINTS.CAMPAIGNS.BY_ID(id));
    return response;
  },

  create: async (data) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.CAMPAIGNS.BASE,
      data,
    );
    return response;
  },

  update: async (id, data) => {
    const response = await axiosInstance.put(
      API_ENDPOINTS.CAMPAIGNS.BY_ID(id),
      data,
    );
    return response;
  },

  delete: async (id) => {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.CAMPAIGNS.BY_ID(id),
    );
    return response;
  },

  toggle: async (id) => {
    const response = await axiosInstance.patch(
      API_ENDPOINTS.CAMPAIGNS.TOGGLE(id),
    );
    return response;
  },
};
