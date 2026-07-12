export const LINK_ERROR_SUBCODES = [2534122, 2534014, 1755006, 2018001];

export const isLinkBlockedError = (errorCode, errorSubcode, errorMessage) => {
  if (LINK_ERROR_SUBCODES.includes(errorSubcode)) return true;
  if (errorMessage && typeof errorMessage === "string") {
    const lower = errorMessage.toLowerCase();
    if (
      lower.includes("link can't be shared") ||
      lower.includes("community standards") ||
      lower.includes("invalid message id") ||
      lower.includes("cannot send link")
    ) {
      return true;
    }
  }
  return false;
};

export const sanitizeLink = (link) => {
  if (!link || typeof link !== "string") return "";
  return link
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
};

export const buildMessageWithLink = ({
  baseMessage,
  link,
  linkDeliveryMode = "no_https",
}) => {
  const cleanBase = String(baseMessage || "").trim();
  if (!link) return cleanBase;

  switch (linkDeliveryMode) {
    case "direct":
      return `${cleanBase}\n\n${link}`;
    case "no_https":
      return `${cleanBase}\n\n${sanitizeLink(link)}`;
    case "delayed":
    case "reply_first":
      return `${cleanBase}\n\nReply "SEND" to get the link!`;
    default:
      return `${cleanBase}\n\n${sanitizeLink(link)}`;
  }
};

export const buildFallbackMessage = ({ baseMessage, link }) => {
  const cleanBase = String(baseMessage || "").trim();
  if (!link) return cleanBase;
  return `${cleanBase}\n\n${sanitizeLink(link)}`;
};

export const buildBioFallbackMessage = ({ baseMessage }) => {
  return `${String(baseMessage || "").trim()}\n\nCheck my bio for the link!`;
};
