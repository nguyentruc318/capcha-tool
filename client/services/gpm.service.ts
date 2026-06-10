import { Browser } from 'playwright';

import { isAxiosError } from 'axios';
import { IAccountRow } from '../types/type';
import { connectGpmProfile, getPage, login } from '../utils/func';
import { LOGIN_URL, SELECTORS } from '../types/constant';

//* Quy trình Auto tự động hóa chính cho từng tài khoản
export async function runAutoForAccount(account: IAccountRow) {
  const { profileId, email, password } = account;

  console.log('\n==================================================');
  console.log(`🚀 [Tool] Đang xử lý tài khoản: ${email}`);

  let browser: Browser | null = null;

  try {
    console.log(`📦 [GPM] Đang mở Profile ID: ${profileId}`);

    browser = await connectGpmProfile(profileId);

    const page = await getPage(browser);

    console.log('🌐 [Browser] Đang mở trang đăng nhập...');

    await page.goto(LOGIN_URL);

    await page.waitForSelector(SELECTORS.username, {
      timeout: 10000,
    });

    await login(page, email, password);

    console.log(`🎉 [Thành công] Đã submit login cho ${email}`);
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(`❌ [Axios Error] ${error.message}`);
    } else {
      console.error(`❌ [Error]`, error);
    }
  } finally {
    console.log('ℹ️ [Tool] Đã ngắt quyền điều khiển Playwright.');
  }
}
