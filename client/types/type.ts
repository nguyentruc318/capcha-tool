export interface IAccountRow {
  profileId: string; // Mã ID lấy từ phần mềm GPM
  username: string; // Tài khoản đăng nhập trang web mục tiêu
  password: string; // Mật khẩu đăng nhập tương ứng
}
export interface GpmStartProfileResponse {
  success: boolean;
  data: {
    websocket_debugging_url: string;
    remote_debugging_port?: string;
  };
}
export interface CapchaCode {
  code: string;
}
