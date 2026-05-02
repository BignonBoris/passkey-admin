import axios from "@/utils/axios";

export type AdminUser = {
  id: string;
  role: string;
  email: string;
};

export type SignInResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: AdminUser;
  };
};

export async function signIn(email: string, password: string, captchaToken: string = "") {
  const response = await axios.post<SignInResponse>("/auth/admin/sign-in", {
    email,
    password,
    captchaToken,
  });
  return response.data;
}
