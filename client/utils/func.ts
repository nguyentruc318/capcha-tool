import { chromium, Browser, Page } from 'playwright';

import axios from 'axios';
import { CapchaCode, GpmStartProfileResponse } from '../types/type';
import { SELECTORS } from '../types/constant';

export async function connectGpmProfile(profileId: string): Promise<Browser> {
  const gpmUrl = `http://127.0.0.1:19995/api/v3/profiles/start/${profileId}`;

  const gpmRes = await axios.get<GpmStartProfileResponse>(gpmUrl);

  if (!gpmRes.data?.success) {
    throw new Error(`Không thể mở GPM Profile ${profileId}`);
  }

  const browserWSEndpoint = gpmRes.data.data.browser_ws_endpoint;

  console.log(`✅ [GPM] Mở Profile thành công. Endpoint: ${browserWSEndpoint}`);

  return chromium.connectOverCDP(browserWSEndpoint);
}
export async function getPage(browser: Browser): Promise<Page> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const context = browser.contexts()[0]!;

  return context.pages()[0] || (await context.newPage());
}
export async function fillLoginForm(
  page: Page,
  email: string,
  password: string,
) {
  await page.fill(SELECTORS.username, email);

  await page.fill(SELECTORS.password, password);
}
export async function getCaptchaBase64(page: Page): Promise<string> {
  const fullSrcBase64 = await page.$eval(
    SELECTORS.captchaImage,
    (img: HTMLImageElement) => img.src,
  );

  if (!fullSrcBase64 || !fullSrcBase64.includes('base64,')) {
    throw new Error('Captcha không chứa dữ liệu Base64 hợp lệ');
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return fullSrcBase64.split('base64,')[1]!;
}
export async function solveCaptcha(imageBase64: string): Promise<string> {
  console.log('🧠 [NestJS] Đang gửi captcha sang AI...');

  const response = await axios.post<CapchaCode>(
    'http://localhost:3000/captcha/solve',
    {
      image: imageBase64,
    },
  );

  if (!response.data?.code) {
    throw new Error('Không nhận được kết quả OCR');
  }

  return response.data.code;
}
export async function submitLogin(page: Page, captchaCode: string) {
  await page.fill(SELECTORS.captchaInput, captchaCode);

  await page.waitForTimeout(500);

  await page.click(SELECTORS.submitButton);
}
export async function login(page: Page, email: string, password: string) {
  console.log('📝 [Browser] Đang nhập thông tin đăng nhập...');

  await fillLoginForm(page, email, password);

  console.log('📸 [Browser] Đang lấy captcha...');

  const imageBase64 = await getCaptchaBase64(page);

  const captchaCode = await solveCaptcha(imageBase64);

  console.log(`✨ [Captcha] Kết quả OCR: ${captchaCode}`);

  await submitLogin(page, captchaCode);
}
