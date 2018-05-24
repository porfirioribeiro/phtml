import { Browser, PDFOptions } from 'puppeteer';

export async function renderUrl(browser: Browser, url: string, pdfOptions: PDFOptions) {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'networkidle2',
  });
  const buffer = await page.pdf(pdfOptions);
  await page.close();
  return buffer;
}
export function renderHtml(browser: Browser, html: string, pdfOptions: PDFOptions) {
  return renderUrl(browser, 'data:text/html,' + html, pdfOptions);
}
