async function updateProductWithImage(req, res, next) {
    const { id } = req.params;
    const { title, price, description, category } = req.body;
  
    // file er tómt ef engri var uploadað
    const { file: { path, mimetype } = {} } = req;
  
    const hasImage = Boolean(path && mimetype);
  
    const product = { title, price, description, category };
  
    const validations = await validateProduct(product, true, id);
  
    if (hasImage) {
      if (!validateImageMimetype(mimetype)) {
        validations.push({
          field: 'image',
          error: `Mimetype ${mimetype} is not legal. ` +
                 `Only ${MIMETYPES.join(', ')} are accepted`,
        });
      }
    }
  
    if (validations.length > 0) {
      return res.status(400).json({
        errors: validations,
      });
    }
  
    // Aðeins ef allt er löglegt uploadum við mynd
    if (hasImage) {
      let upload = null;
      try {
        upload = await cloudinary.uploader.upload(path);
      } catch (error) {
        // Skilum áfram villu frá Cloudinary, ef einhver
        if (error.http_code && error.http_code === 400) {
          return res.status(400).json({ errors: [{
            field: 'image',
            error: error.message,
          }] });
        }
  
        console.error('Unable to upload file to cloudinary');
        return next(error);
      }
  
      if (upload && upload.secure_url) {
        product.image = upload.secure_url;
      } else {
        // Einhverja hluta vegna er ekkert `secure_url`?
        return next(new Error('Cloudinary upload missing secure_url'));
      }
    }
  
    const fields = [
      isString(product.title) ? 'title' : null,
      isString(product.price) ? 'price' : null,
      isString(product.description) ? 'description' : null,
      isString(product.category) ? 'category_id' : null,
      isString(product.image) ? 'image' : null,
    ];
  
    const values = [
      isString(product.title) ? xss(product.title) : null,
      isString(product.price) ? xss(product.price) : null,
      isString(product.description) ? xss(product.description) : null,
      isString(product.category) ? xss(product.category) : null,
      isString(product.image) ? xss(product.image) : null,
    ];
  
    if (!fields.filter(Boolean).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
  
    // update updated if updating updates
    fields.push('updated');
    values.push(new Date());
  
    const result = await conditionalUpdate('products', id, fields, values);
  
    return res.status(201).json(result.rows[0]);
  }