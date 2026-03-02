const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const API_BASE = API_URL;  // Export the base URL

export async function apiFetch(path: string, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options as any).headers,
    },
  });
  return res.json();
}
