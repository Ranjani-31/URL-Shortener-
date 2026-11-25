const AppError = require("../utils/AppError");

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      
      return next(new AppError("Request validation failed", 400, { details: errors }));
    }

    req.validatedBody = result.data;

    next();
  };
};

module.exports = validate;