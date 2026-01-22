"use node";

import crypto from "crypto";

export async function deleteCloudinaryImage(publicId: string) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: timestamp.toString(),
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary delete failed: ${text}`);
  }
}
