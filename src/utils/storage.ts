import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import imageCompression from "browser-image-compression";

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  if (!file) throw new Error("No file provided");

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const storageRef = ref(storage, `users/${userId}/profile_${Date.now()}.jpg`);
    
    await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
};

export const deleteProfileImage = async (imageUrl: string) => {
  if (!imageUrl || !imageUrl.includes("firebase")) return;
  
  try {
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.warn("Failed to delete old profile image:", error);
  }
};
