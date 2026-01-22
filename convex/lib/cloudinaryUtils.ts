export function extractPublicIdFromUrl(url: string, folder: string) {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1].split(".")[0];
  return `${folder}/${fileName}`;
}
