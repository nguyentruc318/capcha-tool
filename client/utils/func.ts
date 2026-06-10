import { chromium, Browser, Page } from 'playwright';

import axios from 'axios';
import { CapchaCode, GpmStartProfileResponse } from '../types/type';
import { SELECTORS } from '../types/constant';

export async function connectGpmProfile(profileId: string): Promise<Browser> {
  const gpmUrl = `http://localhost:9495/api/v1/profiles/start/${profileId}?window_scale=0.8&window_pos=100%2C100&window_size=800%2C600`;

  const gpmRes = await axios.get<GpmStartProfileResponse>(gpmUrl);

  if (!gpmRes.data?.success) {
    throw new Error(`Không thể mở GPM Profile ${profileId}`);
  }

  const browserWSEndpoint =
    gpmRes.data.data.websocket_debugging_url ||
    gpmRes.data.data.remote_debugging_port;

  console.log(`✅ [GPM] Mở Profile thành công. Endpoint: ${browserWSEndpoint}`);

  return chromium.connectOverCDP(browserWSEndpoint!);
}
export async function getPage(browser: Browser): Promise<Page> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const context = browser.contexts()[0]!;

  return context.pages()[0] || (await context.newPage());
}
export async function fillLoginForm(
  page: Page,
  username: string,
  password: string,
) {
  await page.fill(SELECTORS.username, username);

  await page.fill(SELECTORS.password, password);
}
export async function getCaptchaBase64(page: Page): Promise<string> {
  // Đợi captcha load xong và có src hợp lệ
  await page.waitForSelector(SELECTORS.captchaImage, { state: 'visible' });

  // Đợi thêm cho src có base64 (poll liên tục)
  await page.waitForFunction(
    (selector) => {
      const img = document.querySelector(selector) as HTMLImageElement;
      return img?.src?.includes('base64,');
    },
    SELECTORS.captchaImage,
    { timeout: 10000 },
  );

  const fullSrcBase64 = await page.$eval(
    SELECTORS.captchaImage,
    (img: HTMLImageElement) => img.src,
  );

  if (!fullSrcBase64 || !fullSrcBase64.includes('base64,')) {
    throw new Error('Captcha không chứa dữ liệu Base64 hợp lệ');
  }

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

  // await page.click(SELECTORS.submitButton);
}
export async function login(page: Page, username: string, password: string) {
  console.log('📝 [Browser] Đang nhập thông tin đăng nhập...');

  await fillLoginForm(page, username, password);

  console.log('📸 [Browser] Đang lấy captcha...');

  const imageBase64 = await getCaptchaBase64(page);

  const captchaCode = await solveCaptcha(imageBase64);

  console.log(`✨ [Captcha] Kết quả OCR: ${captchaCode}`);

  await submitLogin(page, captchaCode);
}
