const Joi = require("joi");
const logger = require("../utils/logger");

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorDetails = error.details
      .map((detail) => detail.message)
      .join(", ");
    logger.warn(`Invalid request payload: ${errorDetails} from IP: ${req.ip}`);
    return res
      .status(400)
      .json({ error: `Validation failed: ${errorDetails}` });
  }

  next();
};

// Schemas for different endpoints
const locationSchema = Joi.object({
  userId: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  speed: Joi.number().min(0).optional(),
  timestamp: Joi.any().optional(),
});

const tripStartSchema = Joi.object({
  userId: Joi.string().required(),
  startLocation: Joi.string().required(),
});

const hazardReportSchema = Joi.object({
  type: Joi.string().required(),
  severity: Joi.string().valid("low", "medium", "high").required(),
  location: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  validateRequest,
  locationSchema,
  tripStartSchema,
  hazardReportSchema,
};
