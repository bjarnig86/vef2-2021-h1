/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
import cloudinary from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import util from 'util';

const MIMETYPES = ['image/jpeg', 'image/png', 'image/gif'];

const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);
const directory = './temp';

function validateImageMimetype(mimetype) {
  return MIMETYPES.indexOf(mimetype.toLowerCase()) >= 0;
}

/**
 * Tekur inn req og dregur úr því upplýsingar með multer, skilar aftur req
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export function withMulter(req, res, next) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    multer({ dest: './temp' }).single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'Unexpected field') {
          const errors = [
            {
              field: 'image',
              error: 'Unable to read image',
            },
          ];
          reject(err);
          return res.status(400).json({ errors });
        }
        return next(err);
      }

      resolve(req, res, next);
      // resolve(createImageURL(req, res, next));
    });
  });
}

/**
 * Hendir temp file-um úr temp directory
 */
// eslint-disable-next-line consistent-return
async function deleteTemp() {
  try {
    const files = await readdir(directory);
    const unlinkPromises = files.map((filename) =>
      unlink(`${directory}/${filename}`),
    );
    return Promise.all(unlinkPromises);
  } catch (err) {
    console.error(err);
  }
}

/**
 * setur mynd inn í cloudinary og skilar urli á mynd.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export async function createImageURL(req, res, next) {
  const { file: { path, mimetype } = {} } = req;
  const validations = [];
  const hasImage = Boolean(path && mimetype);
  let image = '';
  if (!hasImage) {
    validations.push({
      field: 'image',
      error: 'No image detected',
    });
    return [image, validations];
  }
  if (hasImage) {
    if (!validateImageMimetype(mimetype)) {
      validations.push({
        field: 'image',
        error:
          `Mimetype ${mimetype} is not legal. `
          + `Only ${MIMETYPES.join(', ')} are accepted`,
      });
      return [image, validations];
    }
  }

  if (hasImage) {
    let upload = null;
    try {
      upload = await cloudinary.v2.uploader.upload(path);
    } catch (error) {
      // Skilum áfram villu frá Cloudinary, ef einhver
      if (error.http_code && error.http_code === 400) {
        return res.status(400).json({
          errors: [
            {
              field: 'image',
              error: error.message,
            },
          ],
        });
      }
      console.error('Unable to upload file to cloudinary');
      return next(error);
    }

    if (upload && upload.secure_url) {
      image = upload.secure_url;
    } else {
      return next(new Error('Cloudinary upload missing secure_url'));
    }
  }
  deleteTemp();
  return [image, validations];
}
