import { NextFunction, Request, Response } from 'express';
import rateLimit, { MemoryStore } from 'express-rate-limit';
import { ParamsDictionary } from 'express-serve-static-core';

export const apiLimiter = (limit = 5, time = 15) => {
  const limiter = rateLimit({
    // windowMs: 10 * 60 * 1000, // 10 minutes
    windowMs: time * 60 * 1000, // 1 hour
    max: limit, // Limit each IP to the specified number of requests per hour
    message: {
      success: false,
      message: `In ${time} minutes you have already taken data ${limit} times in IP, try again after ${time} minutes`,
    },
    standardHeaders: true,
    headers: true, // Return rate limit info in the `RateLimit-*` headers
    store: new MemoryStore(), // Use the in-memory store
    // legacyHeaders: true, // Use the legacy store headers
    // keyGenerator: (req: Request) => req.ip as string,
  });

  return async (
    req: Request<ParamsDictionary, any, any, any, Record<string, any>>,
    res: Response<any>,
    next: NextFunction,
  ) => {
    try {
      await limiter(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
