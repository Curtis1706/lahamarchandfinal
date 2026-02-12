import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("[Cloudinary Config] Cloud Name:", cloudName || "MANQUANT");
console.log("[Cloudinary Config] API Key:", apiKey ? "DÉFINI" : "MANQUANT");
console.log("[Cloudinary Config] API Secret:", apiSecret ? "DÉFINI" : "MANQUANT");

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

export default cloudinary;
