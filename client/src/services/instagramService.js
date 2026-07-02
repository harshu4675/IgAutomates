import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const instagramService = {
  getAuthUrl: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.INSTAGRAM.AUTH_URL);
    return response;
  },

  getAccounts: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
    return response;
  },

  disconnect: async (id) => {
    const response = await axiosInstance.delete(
      API_ENDPOINTS.INSTAGRAM.DISCONNECT(id),
    );
    return response;
  },

  getPosts: async (accountId, after = null) => {
    let url = API_ENDPOINTS.INSTAGRAM.POSTS(accountId);
    if (after) url += `?after=${after}`;
    const response = await axiosInstance.get(url);
    return response;
  },
};
