import multiparty from "multiparty";
import fs from "fs";
import ImageKit from "imagekit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handle(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const form = new multiparty.Form();
  const { fields, files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });

  // Initialize ImageKit
  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });

  const Links = [];
  for (const file of files.file) {
    const ext = file.originalFilename.split('.').pop();
    const newFilename = `${Date.now()}.${ext}`;
    const fileContent = fs.readFileSync(file.path);

    try {
      // Upload to ImageKit
      const response = await imagekit.upload({
        file: fileContent, // يمكن أن يكون Buffer أو base64 string
        fileName: newFilename,
        folder: "/hetari-clothes" // مجلد اختياري لتنظيم الصور
      });

      Links.push(response.url);
    } catch (error) {
      console.error("Error uploading to ImageKit:", error);
      return res.status(500).json({ error: "Error uploading file" });
    }
  }

  return res.json({ Links });
}

export const config = {
  api: { bodyParser: false },
};