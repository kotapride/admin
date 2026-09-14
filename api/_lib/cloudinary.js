import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    cloudinary.config({
      secure: true
    });
    return cloudinary;
  }

  if (cloudName && apiKey && apiSecret) {
    if (!isConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });
      isConfigured = true;
    }
    return cloudinary;
  }

  return null;
}

/**
 * Delete asset from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Deletion options (resource_type: 'image' | 'raw')
 */
export async function deleteFromCloudinary(publicId, options = {}) {
  const client = getCloudinary();
  if (!client || !publicId) return null;

  try {
    return await client.uploader.destroy(publicId, options);
  } catch (err) {
    console.warn(`Could not delete Cloudinary asset ${publicId}:`, err.message);
    return null;
  }
}
