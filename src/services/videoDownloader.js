const API_URL = import.meta.env.VITE_API_URL;

export const fetchVideoInfo = async (url) => {
  if (!API_URL) {
    throw new Error(
      'Video API is not configured. Set VITE_API_URL.'
    );
  }

  const response = await fetch(`${API_URL}/api/video/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Unable to resolve video (${response.status})`
    );
  }

  return data;
};