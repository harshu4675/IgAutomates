export const cacheControl = (maxAge = 3600) => {
  return (req, res, next) => {
    if (req.method === "GET") {
      res.set("Cache-Control", `public, max-age=${maxAge}`);
    } else {
      res.set("Cache-Control", "no-store");
    }
    next();
  };
};

export const noCache = (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  next();
};
