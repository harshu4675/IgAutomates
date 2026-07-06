import { validationResult } from "express-validator";
import { errorResponse } from "../utils/apiResponse.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return errorResponse(res, 400, "Validation failed", extractedErrors);
};

export default validate;
