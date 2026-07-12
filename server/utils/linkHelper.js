export const LINK_ERROR_CODES = [508, 551, 200, 100];
export const LINK_ERROR_SUBCODES = [2534122, 2534014, 1755006, 2018001];

export const isLinkBlockedError = (errorCode, errorSubcode, errorMessage) => {
  if (LINK_ERROR_SUBCODES.includes(errorSubcode)) return true;
  if (errorMessage && typeof errorMessage === "string") {
    const lower = errorMessage.toLowerCase();
    if (
      lower.includes("link can't be shared") ||
      lower.includes("community standards") ||
      lower.includes("invalid message id") ||
      lower.includes("cannot send link") ||
      lower.includes("not allowed to send")
    ) {
      return true;
    }
  }
  return false;
};

export const sanitizeLink = (link, mode = "no_https") => {
  if (!link || typeof link !== "string") return "";
  const trimmed = link.trim();
  if (!trimmed) return "";

  switch (mode) {
    case "no_https":
      return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    case "spaced":
      return trimmed
        .replace(/^https?:\/\//i, "")
        .replace(/\./g, " . ")
        .replace(/\//g, " / ");
    case "direct":
    default:
      return trimmed;
  }
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

    case "no_https": {
      const clean = sanitizeLink(link, "no_https");
      return `${cleanBase}\n\n${clean}`;
    }

    case "delayed":
      return `${cleanBase}\n\nReply "SEND" to get the link.`;

    case "reply_first":
      return `${cleanBase}\n\nReply "SEND" and I will share the link with you!`;

    default: {
      const clean = sanitizeLink(link, "no_https");
      return `${cleanBase}\n\n${clean}`;
    }
  }
};

export const buildFallbackMessage = ({ baseMessage, link }) => {
  const cleanBase = String(baseMessage || "").trim();
  if (!link) return cleanBase;
  const clean = sanitizeLink(link, "no_https");
  return `${cleanBase}\n\n${clean}`;
};

export const buildLastResortMessage = ({ baseMessage }) => {
  const cleanBase = String(baseMessage || "").trim();
  return `${cleanBase}\n\nCheck my bio for the link!`;
};

export const extractDomainSafely = (link) => {
  if (!link) return "";
  try {
    const url = new URL(link.startsWith("http") ? link : `https://${link}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return link.replace(/^https?:\/\//i, "").split("/")[0];
  }
};
