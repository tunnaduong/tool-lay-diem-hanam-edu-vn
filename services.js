const error_message = document.querySelector("#error_message");
const error_text = document.getElementById("error_text");
const student_id = document.querySelector("#student_id");
const captcha = document.querySelector("#captcha");
const captcha_code = document.querySelector("#captcha_code");
const form = document.querySelector(".form-card");

const CORS_API_SERVER_URL = "https://hanam-edu.fatties.workers.dev/?";
const CAPTCHA_API_SERVER_URL = "https://tunnaduong.com/test_api/captcha.php";
const USER_INFO_API_SERVER_URL =
  "https://tunnaduong.com/test_api/diemthi_lookup_result_api.php";

// Store timeout ID globally
let errorTimeout = null;

// Show error message
export function showError(message) {
  // Clear any existing timeout to prevent stacking
  if (errorTimeout) {
    clearTimeout(errorTimeout);
  }

  error_text.textContent = message;
  error_message.style.display = "block";
  form.scrollIntoView({ behavior: "smooth" });

  // Store new timeout ID
  errorTimeout = setTimeout(() => {
    error_message.style.display = "none";
    errorTimeout = null;
  }, 5000);

  student_id.focus();
}

export const searchStudent = async (formData) => {
  try {
    const res = await fetch(
      CORS_API_SERVER_URL +
        "https://hanam.edu.vn/hanam/_xuly/search_student_eos/searching",
      {
        method: "POST",
        body: formData,
      }
    );

    const rawText = await res.text();
    const cleanedText = rawText.replace(/^\s*\n/gm, "").trim();

    console.log("cleanedText:", cleanedText);

    // 🛑 Nếu response là HTML hoặc chuỗi exception thì ném lỗi ngay
    if (
      cleanedText.startsWith("<!DOCTYPE html>") ||
      cleanedText.toLowerCase().startsWith("exception")
    ) {
      throw new Error("Server returned invalid content (HTML or Exception)");
    }

    const data = JSON.parse(cleanedText);

    console.log(formData.get("action"), data);
    console.log("ma:", formData.get("ma"));

    if (data.errors) {
      showError(data.errors[0]);
    }

    if (data?.data?.length == 0) {
      showError("Không tìm thấy dữ liệu học sinh!");
      return;
    }

    if (
      Array.isArray(data.errors) &&
      data.errors[0] == "Mã capcha không đúng!"
    ) {
      document.querySelector("#capcha").src =
        CORS_API_SERVER_URL +
        "https://hanam.edu.vn/get_captcha.php?_=1729685557806&keycode=_search_eos";
      captcha.className = "mb-3";
      captcha_code.focus();
      return;
    }

    if (Array.isArray(data.errors)) {
      showError("Không tìm thấy dữ liệu học sinh!");
      return;
    }

    if (formData.get("action") == "show_gradess") {
      document.getElementById("studentGrade").style.display = "block";
    } else {
      document.getElementById("studentInfo").style.display = "block";
    }

    if (Array.isArray(data?.data) && data?.data?.length > 0) {
      sendUserInfo(data?.data[0]);
    }

    return data;
  } catch (e) {
    if (e.message.includes("Server returned invalid content")) {
      showError("Không tìm thấy dữ liệu học sinh!");
      return;
    } else {
      showError(
        "Đã có lỗi xảy ra. Vui lòng thử lại sau hoặc báo lỗi cho chúng tôi."
      );
      console.log("err: ", e);
    }
  }
};

const sendUserInfo = async (data) => {
  const res = await fetch(USER_INFO_API_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: data.full_name,
      class: data.class_name,
      school: data.dept_name,
      student_id: data.student_id,
      sex: data.sex,
      birth_date: data.birth_date,
    }),
  });
  const data2 = await res.json();
  console.log(data2);
};

export const insertCaptcha = (captcha) => {
  fetch(CAPTCHA_API_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: captcha,
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error("Error while saving captcha:", error));
};

export const getCaptcha = async () => {
  try {
    const res = await fetch(CAPTCHA_API_SERVER_URL);
    const data = await res.json();
    return data.content;
  } catch (error) {}
};
