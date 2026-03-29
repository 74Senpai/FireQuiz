import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true,
});

// 👉 request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 👉 response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${process.env.API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        // refresh fail → logout
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
