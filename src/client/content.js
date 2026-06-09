// Hàm cốt lõi để gửi ảnh lên NestJS giải mã
async function giaiMaVaDienCaptcha(imgElement) {
  if (!imgElement || imgElement.naturalWidth === 0) return;

  console.log("[Tool Captcha] Phát hiện ảnh mới, đang tự động giải...");

  // 1. Chuyển ảnh thành Base64
  const canvas = document.createElement("canvas");
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgElement, 0, 0);
  const base64Data = canvas.toDataURL("image/png").split(",")[1];

  // 2. Gửi lên Server NestJS
  try {
    const response = await fetch("http://localhost:3000/captcha/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Data }),
    });

    const data = await response.json();

    if (data.success && data.code) {
      console.log(
        `%c[Tool Captcha] AI giải mã THÀNH CÔNG: ${data.code}`,
        "color: green; font-weight: bold;",
      );

      // 3. Điền vào ô input
      const inputElement =
        document.querySelector('input[placeholder*="xác nhận"]') ||
        document.querySelector('input[name*="captcha"]');
      if (inputElement) {
        inputElement.value = data.code;
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        console.log("[Tool Captcha] Đã tự động điền mã mới!");
      }
    }
  } catch (err) {
    console.error("[Tool Captcha] Lỗi kết nối Server NestJS:", err);
  }
}

// Hàm khởi tạo và theo dõi sự thay đổi của ảnh
function batDauTheoDoiCaptcha() {
  const imgElement =
    document.querySelector("img.captcha-image") ||
    document.querySelector('img[src*="captcha"]');

  if (!imgElement) {
    console.log("[Tool Captcha] Không tìm thấy ảnh CAPTCHA.");
    return;
  }

  // Chạy giải lần đầu tiên khi vừa vào trang
  if (imgElement.complete) {
    giaiMaVaDienCaptcha(imgElement);
  } else {
    imgElement.onload = () => giaiMaVaDienCaptcha(imgElement);
  }

  // DÙNG MUTATION OBSERVER ĐỂ THEO DÕI THUỘC TÍNH SRC CỦA ẢNH
  // Mỗi khi người dùng bấm đổi mã hoặc trang web tự đổi ảnh, thuộc tính 'src' sẽ thay đổi
  const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      if (mutation.type === "attributes" && mutation.attributeName === "src") {
        // Ảnh vừa bị thay đổi link, đợi ảnh tải xong rồi giải mã tiếp
        setTimeout(() => giaiMaVaDienCaptcha(imgElement), 500);
      }
    }
  });

  // Ra lệnh cho bộ theo dõi bắt đầu rình thẻ img CAPTCHA
  observer.observe(imgElement, { attributes: true });
  console.log(
    "[Tool Captcha] Đã bật bộ rình rập, CAPTCHA cứ đổi là tool tự chạy!",
  );
}

// Chờ trang tải xong 1 giây rồi kích hoạt bộ theo dõi
setTimeout(batDauTheoDoiCaptcha, 1000);
