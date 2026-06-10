import type { IAccountRow } from '../types/type';
import * as XLSX from 'xlsx';
// Định nghĩa Interface cho cấu trúc 3 cột của file Excel

export function docFileExcel(filePath: string): IAccountRow[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    if (!firstSheetName) {
      throw new Error('File Excel không có sheet nào');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('Không tìm thấy worksheet');
    }
    // Chuyển dữ liệu sheet thành mảng JSON dạng object
    const rawData = XLSX.utils.sheet_to_json<IAccountRow>(worksheet);

    // Map lại dữ liệu để đảm bảo đúng định dạng thuộc tính, tránh lỗi gõ sai chữ hoa/thường ở tiêu đề Excel
    return rawData
      .map((row) => ({
        profileId: String(row.profileId).trim(),
        username: String(row.username).trim(),
        password: String(row.password).trim(),
      }))
      .filter((row) => row.profileId !== ''); // Lọc bỏ dòng trống không có ID GPM
  } catch (error: any) {
    console.error(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      `❌ [Lỗi] Không thể đọc file Excel tại ${filePath}: ${error.message}`,
    );
    return [];
  }
}
