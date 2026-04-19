import axios from "axios";
import axiosAuth from "./interceptor";
import { API_BASE_URL } from "./config";

export interface BrandingData {
  brand_name: string;
  brand_logo_url: string | null;
  brand_favicon_url: string | null;
}

export const getBranding = async (): Promise<BrandingData> => {
  const res = await axios.get(`${API_BASE_URL}/branding`);
  return res.data;
};

export const updateBranding = async (data: Partial<BrandingData>): Promise<BrandingData> => {
  const res = await axiosAuth.put(`${API_BASE_URL}/branding`, data);
  return res.data;
};

export const uploadBrandLogo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosAuth.post(`${API_BASE_URL}/branding/upload-logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.brand_logo_url;
};

export const removeBrandLogo = async (): Promise<void> => {
  await axiosAuth.delete(`${API_BASE_URL}/branding/logo`);
};

export const uploadBrandFavicon = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosAuth.post(`${API_BASE_URL}/branding/upload-favicon`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.brand_favicon_url;
};

export const removeBrandFavicon = async (): Promise<void> => {
  await axiosAuth.delete(`${API_BASE_URL}/branding/favicon`);
};
