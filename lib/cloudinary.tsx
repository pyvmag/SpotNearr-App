import * as ImageManipulator from "expo-image-manipulator";

export const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;


export const compressImage = async (uri: string): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
  );

  return result.uri;
};

export const uploadImageToCloudinary = async (
  imageUri: string
): Promise<{ url: string; publicId: string }> => {
  const compressedUri = await compressImage(imageUri);

  const formData = new FormData();

  formData.append("file", {
    uri: compressedUri,
    type: "image/webp",
    name: "upload.webp",
  } as any);

  formData.append("upload_preset", "content_upload");
  formData.append("folder", "content");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.secure_url || !data.public_id) {
    console.error("Cloudinary error:", data);
    throw new Error("Image upload failed");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};
