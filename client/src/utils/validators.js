export const validators = {
  email: (value) => {
    if (!value) return "Email is required";
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return "Invalid email address";
    }
    return true;
  },

  password: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return true;
  },

  required: (value) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return "This field is required";
    }
    return true;
  },

  keyword: (value) => {
    if (!value) return "Keyword is required";
    if (value.length < 2) return "Keyword must be at least 2 characters";
    if (value.length > 50) return "Keyword must be less than 50 characters";
    return true;
  },

  message: (value) => {
    if (!value) return "Message is required";
    if (value.length < 10) return "Message must be at least 10 characters";
    if (value.length > 1000) return "Message must be less than 1000 characters";
    return true;
  },

  url: (value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return "Invalid URL";
    }
  },
};
