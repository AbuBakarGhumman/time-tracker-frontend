import axios from "axios";
import { API_BASE_URL } from "./config";

export const uploadProfileImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("📤 Starting image upload...");
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("File details:", { name: file.name, size: file.size, type: file.type });
    console.log("Uploading to:", `${API_BASE_URL}/images/upload-profile-pic`);
    
    const response = await axios.post(`${API_BASE_URL}/images/upload-profile-pic`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000, // 30 second timeout
    });
    
    console.log("✅ Upload response received:");
    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    
    if (!response.data.profile_pic_url) {
      throw new Error("Response missing profile_pic_url field");
    }
    
    const imageUrl = response.data.profile_pic_url;
    console.log("✅ Image URL extracted:", imageUrl);
    
    return imageUrl;
  } catch (error: any) {
    console.error("❌ Image upload error details:");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Axios error config:", error.config);
    console.error("Response status:", error.response?.status);
    console.error("Response statusText:", error.response?.statusText);
    console.error("Response headers:", error.response?.headers);
    console.error("Response data:", error.response?.data);
    console.error("Request headers sent:", error.config?.headers);
    
    // Extract meaningful error message
    let errorMessage = "Image upload failed";
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.statusText) {
      errorMessage = `${error.response.status} ${error.response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
};
