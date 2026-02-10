import { v2 as cloudinary } from 'cloudinary';

console.log("[Cloudinary Config] Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "DEFNI" : "MANQUANT");
console.log("[Cloudinary Config] API Key:", process.env.CLOUDINARY_API_KEY ? "DEFNI" : "MANQUANT");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export default cloudinary;
