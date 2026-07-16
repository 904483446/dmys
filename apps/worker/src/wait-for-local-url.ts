type WaitForLocalUrlDependencies = {
  fetch: (url: string) => Promise<{ ok: boolean }>;
  sleep: (milliseconds: number) => Promise<void>;
};

function isLocalUrl(value: string) {
  const url = new URL(value);
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
  );
}

export async function waitForLocalUrl(
  dependencies: WaitForLocalUrlDependencies,
  url: string,
  attempts: number,
) {
  if (!isLocalUrl(url)) throw new Error('UNSAFE_BROWSER_URL');
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      if ((await dependencies.fetch(url)).ok) return;
    } catch {
      // 服务启动期间的连接失败由下一次轮询处理。
    }
    if (attempt + 1 < attempts) await dependencies.sleep(250);
  }
  throw new Error('LOCAL_SERVER_TIMEOUT');
}
