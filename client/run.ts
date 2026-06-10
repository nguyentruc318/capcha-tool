/**
 * Hàm đọc file Excel và chuyển thành mảng JSON dữ liệu sạch
 * @param filePath Đường dẫn tới file Excel
 */

import { docFileExcel } from './services/excel.service';
import { runAutoForAccount } from './services/gpm.service';

/**

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

main().catch((error) => {
  console.error(
    '❌ [Lỗi hệ thống] Chương trình gặp lỗi không mong muốn:',
    error,
  );
});
