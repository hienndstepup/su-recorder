import { apiClient } from "./index";

const appEndpoints = {
  CHECK_ASR: "/speech/api/v1/check/tofu-open/asr_en",
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
};
