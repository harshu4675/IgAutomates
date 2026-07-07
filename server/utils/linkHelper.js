export const LINK_ERROR_CODES = [508, 551, 200, 100];
export const LINK_ERROR_SUBCODES = [2534122, 2534014, 1755006];

export const isLinkBlockedError = (errorCode, errorSubcode, errorMessage) => {
  if (LINK_ERROR_SUBCODES.includes(errorSubcode)) return true;
  if (errorMessage && typeof errorMessage === "string") {
    const lower = errorMessage.toLowerCase();
    if (
      lower.includes("link can't be shared") ||
      lower.includes("community standards") ||
      lower.includes("invalid message id")
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
    case "reversed":
      return trimmed.split("").reverse().join("");
    case "direct":
    default:
      return trimmed;
  }
};

export const buildMessageWithLink = ({
  baseMessage,
  link,
  linkDeliveryMode = "no_https",
  linkLabel = "Link",
}) => {
  if (!link) return baseMessage;

  const cleanBase = String(baseMessage || "").trim();

  switch (linkDeliveryMode) {
    case "direct":
      return `${cleanBase}\n\n${link}`;

    case "no_https": {
      const clean = sanitizeLink(link, "no_https");
      return `${cleanBase}\n\n${linkLabel}: ${clean}`;
    }

    case "delayed":
      return cleanBase;

    case "reply_first":
      return `${cleanBase}\n\nReply "SEND" and I will share the link with you!`;

    default:
      return `${cleanBase}\n\n${link}`;
  }
};

export const shouldSendLinkSeparately = (linkDeliveryMode) => {
  return linkDeliveryMode === "delayed";
};

export const buildFallbackMessage = ({ baseMessage, link }) => {
  const cleanBase = String(baseMessage || "").trim();
  if (!link) return cleanBase;
  const clean = sanitizeLink(link, "no_https");
  return `${cleanBase}\n\nGet it from: ${clean}\n\n(Copy and paste in your browser)`;
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
