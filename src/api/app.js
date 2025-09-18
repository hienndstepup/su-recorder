import { apiClient } from "./index";

const appEndpoints = {
  CHECK_ASR: "/speech/api/v1/check/tofu-open/asr_en",
  CHECK_ASR_EN_VN: "/tofu/api/v1/tofu-open/chat_bot/asr",
};

export const appApi = {
  checkAsr: async (formData) => {
    const response = await apiClient.public.post(
      appEndpoints.CHECK_ASR,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  },
  checkAsrEnVn: async (formData) => {
    const response = await apiClient.public.post(
      appEndpoints.CHECK_ASR_EN_VN,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  },
};
