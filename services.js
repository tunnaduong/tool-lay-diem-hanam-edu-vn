const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");

export const searchStudent = async (formData) => {
  try {
    const res = await fetch(
      "https://cors-anywhere-k4dp.onrender.com/https://hanam.edu.vn/hanam/_xuly/search_student_eos/searching",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();
    console.log(formData.get("action"), data);
    if (data.errors) {
      error_message.textContent = data.errors[0];
      student_id.focus();
    }

    return data;
  } catch (e) {
    error_message.textContent = "Không tìm thấy dữ liệu học sinh!";
    console.log("err: ", e);
  }
};
