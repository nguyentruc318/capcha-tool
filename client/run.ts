import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as XLSX from 'xlsx';
import axios from 'axios';

// Định nghĩa Interface cho cấu trúc 3 cột của file Excel
interface IAccountRow {
  profileId: string; // Mã ID lấy từ phần mềm GPM
  taiKhoan: string; // Tài khoản đăng nhập trang web mục tiêu
  matKhau: string; // Mật khẩu đăng nhập tương ứng
}

/**
 * Hàm đọc file Excel và chuyển thành mảng JSON dữ liệu sạch
 * @param filePath Đường dẫn tới file Excel
 */
function docFileExcel(filePath: string): IAccountRow[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const worksheet = workbook.Sheets[firstSheetName];

    // Chuyển dữ liệu sheet thành mảng JSON dạng object
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Map lại dữ liệu để đảm bảo đúng định dạng thuộc tính, tránh lỗi gõ sai chữ hoa/thường ở tiêu đề Excel
    return rawData
      .map((row) => ({
        profileId: String(row.profileId).trim(),
        taiKhoan: String(row.taiKhoan).trim(),
        matKhau: String(row.password).trim(),
      }))
      .filter((row) => row.profileId !== ''); // Lọc bỏ dòng trống không có ID GPM
  } catch (error: any) {
    console.error(
      `❌ [Lỗi] Không thể đọc file Excel tại ${filePath}:`,
      error.message,
    );
    return [];
  }
}

/**
 * Quy trình Auto tự động hóa chính cho từng tài khoản
 */
async function runAutoForAccount(account: IAccountRow) {
  const { profileId, taiKhoan, matKhau } = account;
  console.log(`\n==================================================`);
  console.log(`🚀 [Tool] Đang xử lý tài khoản: \x1b[36m${taiKhoan}\x1b[0m`);
  console.log(`📦 [GPM] Đang ra lệnh mở Profile ID: ${profileId}`);

  let browser: Browser | null = null;

  try {
    // 1. Gọi API tới phần mềm GPM-Login đang bật trên máy để kích hoạt trình duyệt độc lập
    // GPM tự động kích hoạt Proxy (nếu có) được cài trong Profile đó
    const gpmUrl = `http://127.0.0.1:19995/api/v3/profiles/start/${profileId}`;
    const gpmRes = await axios.get(gpmUrl);

    if (!gpmRes.data || !gpmRes.data.success) {
      console.error(
        `❌ [Lỗi GPM] Thất bại khi mở Profile ID: ${profileId}. Bỏ qua tài khoản này.`,
      );
      return;
    }

    // Lấy đường dẫn cổng điều khiển kết nối do GPM trả về
    const browserWSEndpoint = gpmRes.data.data.browser_ws_endpoint;
    console.log(
      `✅ [GPM] Mở Profile thành công. Cổng điều khiển: ${browserWSEndpoint}`,
    );

    // 2. Playwright kết nối vào trình duyệt Chrome biệt lập của GPM thông qua giao thức CDP
    browser = await chromium.connectOverCDP(browserWSEndpoint);
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // 3. Điều hướng tới trang web của bên thứ ba
    console.log(`🌐 [Browser] Đang đi đến trang đăng nhập...`);
    await page.goto('https://example.com'); // ⚠️ BẠN THAY BẰNG LINK WEB THẬT Ở ĐÂY

    // Đợi các thẻ Input xuất hiện trên màn hình
    // ⚠️ BẠN THAY SELECTOR CHUẨN CỦA TRANG WEB THẬT VÀO ĐÂY
    const userSelector = 'input[type="text"]';
    const passSelector = 'input[type="password"]';
    const captchaImgSelector = 'img.image'; // Selector của thẻ ảnh CAPTCHA (hoặc thẻ canvas)
    const captchaInputSelector = 'input[placeholder*="code"]';
    const submitBtnSelector = 'button[type="submit"]';

    await page.waitForSelector(userSelector, { timeout: 10000 });

    // 4. Điền tự động Tài khoản và Mật khẩu lấy từ cột 2 và cột 3 trong file Excel
    console.log(`📝 [Browser] Đang tự động nhập thông tin đăng nhập...`);
    await page.fill(userSelector, taiKhoan);
    await page.fill(passSelector, matKhau);

    // 5. Chụp ảnh vùng mã bảo mật CAPTCHA dạng Base64
    console.log(`📸 [Browser] Đang tìm và chụp hình vùng mã CAPTCHA...`);
    const fullSrcBase64 = await page.$eval(
      captchaImgSelector,
      (img: HTMLImageElement) => img.src,
    );

    if (!fullSrcBase64 || !fullSrcBase64.includes('base64,')) {
      console.error(
        '❌ [Lỗi] Thẻ ảnh không chứa dữ liệu Base64 hợp lệ hoặc chưa tải xong.',
      );
      return;
    }

    const base64Data = fullSrcBase64.split('base64,')[1];

    // 6. Gửi chuỗi ảnh Base64 sang Server Backend NestJS của bạn để giải mã
    console.log(
      `🧠 [NestJS] Đang gửi dữ liệu ảnh sang Server giải mã AI (Cổng 3000)...`,
    );
    const serverNestUrl = 'http://localhost:3000/captcha/solve';

    const nestRes = await axios.post(serverNestUrl, { image: base64Data });

    if (nestRes.data && nestRes.data.success) {
      const maCaptchaGiaiDuoc = nestRes.data.code;
      console.log(
        `✨ [NestJS] AI giải mã THÀNH CÔNG! Kết quả trả về: \x1b[32m${maCaptchaGiaiDuoc}\x1b[0m`,
      );

      // 7. Điền mã số CAPTCHA vào ô nhập liệu
      await page.fill(captchaInputSelector, maCaptchaGiaiDuoc);

      // Đợi nửa giây cho giống hành vi của người thật gõ máy rồi tự bấm Login
      await page.waitForTimeout(500);
      console.log(`🎯 [Browser] Đang tự động click nút Đăng nhập...`);
      await page.click(submitBtnSelector);

      console.log(
        `🎉 [Thành công] Hoàn thành quy trình Auto Login cho tài khoản: ${taiKhoan}`,
      );
    } else {
      console.error(
        `❌ [Lỗi NestJS] Server NestJS phản hồi thất bại hoặc không giải được ảnh.`,
      );
    }
  } catch (error: any) {
    console.error(
      `❌ [Hệ thống] Gặp lỗi nghiêm trọng khi xử lý tài khoản ${taiKhoan}:`,
      error.message,
    );
  } finally {
    // 🌟 ĐIỂM QUAN TRỌNG:
    // Chúng ta KHÔNG GỌI lệnh `browser.close()` ở đây.
    // Việc này giúp Playwright nhường lại quyền và ngắt kết nối điều khiển chạy ngầm,
    // nhưng cửa sổ Chrome GPM thật trên màn hình vẫn sẽ GIỮ NGUYÊN trạng thái đăng nhập thành công cho người dùng nhìn.
    console.log(
      `ℹ️ [Tool] Đã giải phóng quyền điều khiển. Trình duyệt GPM vẫn tiếp tục hiển thị.`,
    );
  }
}

/**
 * Hàm khởi động chạy toàn bộ chương trình
 */
async function main() {
  console.log(
    '🤖 === HỆ THỐNG AUTOMATION GPM & CAPTCHA CHÍNH THỨC KHỞI ĐỘNG ===',
  );

  // Nạp danh sách từ file dữ liệu
  const danhSachAcc = docFileExcel('data.xlsx');

  if (danhSachAcc.length === 0) {
    console.log(
      '❌ [Dừng tool] File Excel không có dữ liệu hoặc lỗi định dạng. Vui lòng kiểm tra lại!',
    );
    return;
  }

  // Chạy vòng lặp tuần tự mở từng cửa sổ GPM nối tiếp nhau
  for (const account of danhSachAcc) {
    await runAutoForAccount(account);

    // Nghỉ chân 3 giây giữa các tài khoản để hệ thống Windows và phần mềm GPM không bị nghẽn RAM
    console.log(
      `⏱️ [Tool] Nghỉ 3 giây trước khi tự động chuyển sang mở tài khoản tiếp theo...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log(`\n🏁 ==================================================`);
  console.log(
    `🎉 [TOOL HOÀN THÀNH] ĐÃ CHẠY HẾT SẠCH TOÀN BỘ TÀI KHOẢN TRONG FILE EXCEL!`,
  );
}

main();
