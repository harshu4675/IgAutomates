import { validationResult } from "express-validator";
import { errorResponse } from "../utils/apiResponse.js";

const validate = (...args) => {
  if (args.length === 3 && typeof args[2] === "function") {
    const [req, res, next] = args;
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return errorResponse(res, 400, "Validation failed", extractedErrors);
  }

  const validations = args[0];

  return async (req, res, next) => {
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors && result.errors.length) break;
      }
    }

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
};

export default validate;
