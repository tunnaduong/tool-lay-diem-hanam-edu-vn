const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const captcha = document.querySelector("#captcha");
const captcha_code = document.querySelector("#captcha_code");

const CORS_API_SERVER_URL = "https://hanam-edu.fatties.workers.dev/?";
const CAPTCHA_API_SERVER_URL = "https://tunnaduong.com/test_api/captcha.php";

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
      error_message.textContent = data.errors[0];
      student_id.focus();
    }

    if (data?.data?.length == 0) {
      error_message.textContent = "Không tìm thấy dữ liệu học sinh!";
      student_id.focus();
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

    if (formData.get("action") == "show_gradess") {
      document.getElementById("studentGrade").style.display = "block";
    } else {
      document.getElementById("studentInfo").style.display = "block";
    }

    return data;
  } catch (e) {
    if (e.message.includes("Server returned invalid content")) {
      error_message.textContent = "Không tìm thấy dữ liệu học sinh!";
      student_id.focus();
      return;
    } else {
      error_message.textContent =
        "Đã có lỗi xảy ra. Vui lòng thử lại sau hoặc báo lỗi cho chúng tôi.";
      console.log("err: ", e);
    }
  }
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
