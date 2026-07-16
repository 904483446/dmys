type BrowserPage = {
  on: (event: 'console', listener: (message: { type: () => string }) => void) => void;
  goto: (url: string) => Promise<{ status: () => number } | null>;
};

function isLocalUrl(value: string) {
  const url = new URL(value);
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
  );
}

export async function inspectLocalHomepage(dependencies: { page: BrowserPage }, url: string) {
  if (!isLocalUrl(url)) throw new Error('UNSAFE_BROWSER_URL');
  let errorCount = 0;
  let warningCount = 0;
  dependencies.page.on('console', (message) => {
    if (message.type() === 'error') errorCount += 1;
    if (message.type() === 'warning') warningCount += 1;
  });
  const response = await dependencies.page.goto(url);
  const statusCode = response?.status() ?? 0;
  return {
    homepageReachable: statusCode >= 200 && statusCode < 400,
    statusCode,
    errorCount,
    warningCount,
  };
}
