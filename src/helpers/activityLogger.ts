import express, { Response, NextFunction } from 'express';
import { ProtectedRequest } from 'app-request';
// import prisma from '../database/prismaClient';
// import { UAParser } from 'ua-parser-js';

const router = express.Router();

// Define logPageVisit middleware
const logPageVisit = async (req: ProtectedRequest, res: Response, next: NextFunction) => {
  try {
    // Skip static routes (if needed)
    if (req.originalUrl.startsWith('/static')) {
      return next();
    }

    // if (req.user) {
    //   const parser = new UAParser(req.headers['user-agent']);
    //   const browser = parser.getBrowser().name || 'Unknown';

    //   await prisma.userActivity.create({
    //     data: {
    //       userId: req.user.id,
    //       activityType: 'PAGE_VISIT',
    //       pageUrl: req.originalUrl,
    //       browser,
    //     },
    //   });
    // }
    next();
  } catch (error) {
    console.error('Error recording pageviews:', error);
    next();
  }
};

// Attach middleware to router
router.use(logPageVisit);

export default router;