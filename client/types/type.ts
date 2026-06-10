export interface IAccountRow {
  profileId: string; // Mã ID lấy từ phần mềm GPM
  email: string; // Tài khoản đăng nhập trang web mục tiêu
  password: string; // Mật khẩu đăng nhập tương ứng
}
export interface GpmStartProfileResponse {
  success: boolean;
  data: {
    browser_ws_endpoint: string;
    remote_debugging_address?: string;
  };
}
export interface CapchaCode {
  code: string;
}
