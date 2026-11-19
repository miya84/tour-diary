// 로그인 후 돌아갈 경로. 같은 출처의 경로만 허용하고 나머지는 fallback으로 보낸다.
export const safeNextPath = (path: unknown, fallback = "/", origin?: string) => {
  if (typeof path !== "string" || !path.startsWith("/")) return fallback;

  const currentOrigin = origin ?? window.location.origin;

  try {
    const url = new URL(path, currentOrigin);
    return url.origin === currentOrigin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
};
