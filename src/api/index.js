import axios from "axios";

// Tạo axios instance cho API công khai (người chưa đăng nhập)
const publicApi = axios.create({
  baseURL: "https://tofu.stepup.edu.vn",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const apiClient = {
  // API cho người chưa đăng nhập (public)
  public: {
    // GET request với params
    get: (url, params = {}, config = {}) => {
      const finalConfig = {
        ...config,
        params: { ...params, ...config.params },
      };
      return publicApi.get(url, finalConfig);
    },

    // POST request
    post: (url, data = {}, config = {}) => publicApi.post(url, data, config),

    // PUT request
    put: (url, data = {}, config = {}) => publicApi.put(url, data, config),

    // PATCH request
    patch: (url, data = {}, config = {}) => publicApi.patch(url, data, config),

    // DELETE request
    delete: (url, config = {}) => publicApi.delete(url, config),

    // Upload file
    upload: (url, formData, config = {}) => {
      return publicApi.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        },
      });
    },
  },
};
