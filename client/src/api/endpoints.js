export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    ME: "/auth/me",
    LOGOUT: "/auth/logout",
  },
  INSTAGRAM: {
    AUTH_URL: "/instagram/auth-url",
    ACCOUNTS: "/instagram/accounts",
    DISCONNECT: (id) => `/instagram/accounts/${id}`,
    POSTS: (accountId) => `/instagram/accounts/${accountId}/posts`,
  },
  CAMPAIGNS: {
    BASE: "/campaigns",
    BY_ID: (id) => `/campaigns/${id}`,
    TOGGLE: (id) => `/campaigns/${id}/toggle`,
  },
  ANALYTICS: {
    OVERVIEW: "/analytics/overview",
    ACTIVITY: "/analytics/activity",
    HOURLY: "/analytics/hourly",
    CAMPAIGN: (id) => `/analytics/campaign/${id}`,
  },
};
