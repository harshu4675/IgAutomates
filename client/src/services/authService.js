import axiosInstance from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    return response;
  },

  register: async (userData) => {
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
    );
    return response;
  },

  getMe: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    return response;
  },

  logout: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response;
  },
};
