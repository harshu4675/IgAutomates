import axiosInstance from "@/api/axiosInstance";

export const webhookService = {
  testCampaign: async ({ campaignId, username, commentText }) => {
    const response = await axiosInstance.post("/webhook/test", {
      campaignId,
      username,
      commentText,
    });
    return response;
  },
};
