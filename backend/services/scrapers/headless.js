import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let _browser = null;
let _launchPromise = null;

async function getBrowser() {
  if (_browser) {
    try { await _browser.version(); return _browser; } catch { _browser = null; }
  }
  if (_launchPromise) return _launchPromise;
  _launchPromise = puppeteer.launch({
    executablePath: CHROME,
    headless:       'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,900',
    ],
  }).then(b => { _browser = b; _launchPromise = null; return b; })
    .catch(e => { _launchPromise = null; throw e; });
  return _launchPromise;
}

/**
 * Open a page, navigate to url, wait for `waitFor` selector or ms, return html.
 * Automatically closes the page after use.
 */
export async function fetchWithBrowser(url, { waitFor = 3000, timeout = 30_000, extraWait = 0 } = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8' });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    if (typeof waitFor === 'string') {
      await page.waitForSelector(waitFor, { timeout: 8000 }).catch(() => {});
    } else {
      await new Promise(r => setTimeout(r, waitFor));
    }

    if (extraWait > 0) await new Promise(r => setTimeout(r, extraWait));

    return await page.content();
  } finally {
    await page.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (_browser) { await _browser.close().catch(() => {}); _browser = null; }
}
