const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const getBackendRoot = () => {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return API_BASE_URL.replace(/\/api\/?$/, '/');
  }

  return '';
};

export const resolveImageUrl = (src?: string | null) => {
  let value = src?.trim().replace(/\\/g, '/');
  if (!value) return null;
  value = value.replace(/^["']|["']$/g, '');
  if (/^(blob:|data:|https?:\/\/)/i.test(value)) return value;

  const backendRoot = getBackendRoot();
  const withBackendRoot = (path: string) => backendRoot ? new URL(path, backendRoot).toString() : path;

  if (value.startsWith('/uploads')) return withBackendRoot(value);
  if (value.startsWith('uploads/')) return withBackendRoot(`/${value}`);
  if (value.startsWith('api/uploads/')) return withBackendRoot(`/${value.replace(/^api\//, '')}`);
  if (value.startsWith('students/')) return withBackendRoot(`/uploads/${value}`);
  if (/^[\w.-]+\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(value)) return withBackendRoot(`/uploads/students/${value}`);

  return value;
};
