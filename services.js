const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const captcha = document.querySelector("#captcha");
const captcha_code = document.querySelector("#captcha_code");

export const searchStudent = async (formData) => {
  try {
    const res = await fetch(
      "https://cors.21112003.xyz/https://hanam.edu.vn/hanam/_xuly/search_student_eos/searching",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
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
        "https://cors.21112003.xyz/https://hanam.edu.vn/get_captcha.php?_=1729685557806&keycode=_search_eos";
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
    error_message.textContent =
      "Đã có lỗi xảy ra. Vui lòng thử lại sau hoặc báo lỗi cho chúng tôi.";
    console.log("err: ", e);
  }
};

export const insertCaptcha = (captcha) => {
  fetch("https://tunnaduong.com/test_api/captcha.php", {
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
    const res = await fetch("https://tunnaduong.com/test_api/captcha.php");
    const data = await res.json();
    return data.content;
  } catch (error) {}
};
