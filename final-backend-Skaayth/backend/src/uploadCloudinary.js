const multer = require('multer');
const stream = require('stream');
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_URL) {
    console.warn('WARNING: CLOUDINARY_URL environment variable is not set');
}

const doUpload = (publicId, req, res, next) => {
    if (!req.file) {
        return next();
    }

    const options = { resource_type: 'auto' };
    if (req.body[publicId]) {
        options.public_id = req.body[publicId];
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).send({ error: 'Image upload failed' });
        }
        req.fileurl = result.url;
        req.fileid = result.public_id;
        next();
    });

    const s = new stream.PassThrough();
    s.end(req.file.buffer);
    s.pipe(uploadStream);
    s.on('end', uploadStream.end);
};

const uploadImage = (publicId) => (req, res, next) =>
    multer().single('image')(req, res, () => 
        doUpload(publicId, req, res, next));

module.exports = uploadImage;

