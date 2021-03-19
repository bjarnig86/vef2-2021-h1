import express from 'express';
import dotenv from 'dotenv';
import xss from 'xss';

dotenv.config();

export const router = express.Router();

router.post('/tv/:id/rate');
