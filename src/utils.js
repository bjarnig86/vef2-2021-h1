import xss from 'xss';
import { param, body, validationResult } from 'express-validator';

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
export function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export const validationMiddlewareId = [
  param('id').isNumeric().withMessage('id þarf að vera tala'),
];

export const validationMiddlewareParamSeason = [
  param('season').isNumeric().withMessage('season þarf að vera tala'),
];

export const xssSanitizationId = [
  param('season').customSanitizer((v) => xss(v)),
];

export const xssSanitizationParamSeason = [
  param('season').customSanitizer((v) => xss(v)),
];

export async function validationCheck(req, res, next) {
  const validation = validationResult(req);
  // console.log('validation :>> ', validation);

  if (!validation.isEmpty()) {
    return res.json({ errors: validation.errors });
  }

  return next();
}
