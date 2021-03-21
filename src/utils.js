import xss from 'xss';
import { param, validationResult } from 'express-validator';
import { query } from './db.js';

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

export async function conditionalUpdate(table, id, fields, values) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values
    .filter(
      (i) => typeof i === 'string'
      || typeof i === 'number'
      || i instanceof Date,
    );

  if (filteredFields.length === 0) {
    console.log(`filteredFields --> ${filteredFields}`);
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues = [id].concat(filteredValues);

  // debug('Conditional update', q, queryValues);

  const result = await query(q, queryValues);

  return result;
}

export function isString(s) {
  return typeof s === 'string';
}

export function isItEmpty(s) {
  return s != null && !s;
}

export function lengthValidationError(s, min, max) {
  const length = s && s.length ? s.length : 'undefined';

  const minMsg = min ? `at least ${min} characters` : '';
  const maxMsg = max ? `at most ${max} characters` : '';
  const msg = [minMsg, maxMsg].filter(Boolean).join(', ');
  const lenMsg = `Current length is ${length}.`;

  return `Must be non empty string ${msg}. ${lenMsg}`;
}

export function isNotEmptyString(s, { min = undefined, max = undefined } = {}) {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }

  if (max && s.length > max) {
    return false;
  }

  if (min && s.length < min) {
    return false;
  }

  return true;
}
