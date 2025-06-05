import {
  searchStudent,
  insertCaptcha,
  getCaptcha,
  showError,
} from "./services.js";

const getScore = document.querySelector("#getScore");
const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const year = document.querySelector("#year");
const semester = document.querySelector("#semester");
const btnLoad = document.querySelector("#btnLoad");
const captcha_code = document.querySelector("#captcha_code");

const CORS_API_SERVER_URL = "https://hanam-edu.fatties.workers.dev/?";

const renderButtons = `<button type="button" id="getScore" class="btn btn-custom btn-primary-custom">
<i class="bi bi-clipboard-data me-2"></i> Lấy điểm 
</button> 
<button type="button" id="getStudentInfo" class="btn btn-custom btn-secondary-custom">
<i class="bi bi-person-lines-fill me-2"></i> Lấy thông tin học sinh 
</button>`;

var formData = new FormData();
var formData2 = new FormData();
var isClicked = false;

// Form validation
function validateForm() {
  const studentId = document.getElementById("student_id").value.trim();
  const year = document.getElementById("year").value;
  const semester = document.getElementById("semester").value;

  if (!studentId) {
    showError("Vui lòng nhập mã học sinh");
    return false;
  }

  if (!year || !semester) {
    showError("Vui lòng chọn năm học và học kỳ");
    return false;
  }

  return true;
}

const callApi = async (type = "grade") => {
  if (!validateForm()) {
    return;
  }

  btnLoad.innerHTML = `
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Đang tải...</span>
  </div>
  <p class="mt-1 text-muted">Đang xử lý yêu cầu...</p>
  `;

  isClicked = true;
  // HEAD1259168
  if (type == "info") {
    formData.append("year", year.value);
    formData.append("semesterid", semester.value);
    formData.append("id", student_id.value.toUpperCase());
    formData.append("ma", captcha_code?.value || (await getCaptcha()));
    formData.append("action", "search");

    renderProfile(formData);
  } else {
    formData2.append("year", year.value);
    formData2.append("sem", semester.value);
    formData2.append("studentid", student_id.value.toUpperCase());
    formData2.append("action", "show_gradess");

    renderGrade(formData2, semester.value);
  }

  if (captcha_code.value) {
    insertCaptcha(captcha_code.value);
    document.querySelector("#captcha").className = "mb-3 d-none";
    captcha_code.value = "";
  }
};

const reloadCaptcha = () => {
  const captchaImage = document.querySelector("#capcha");

  // Show the loading gif
  captchaImage.src = "./loading.gif";

  // Create a new image to preload the captcha
  const newCaptcha = new Image();
  const captchaUrl =
    CORS_API_SERVER_URL +
    "https://hanam.edu.vn/get_captcha.php?keycode=_search_eos&_=" +
    Date.now();

  newCaptcha.onload = () => {
    // When it's loaded, swap it in
    captchaImage.src = newCaptcha.src;
  };

  // Start loading the new captcha
  newCaptcha.src = captchaUrl;
};

document
  .querySelector("#refresh-captcha")
  .addEventListener("click", () => reloadCaptcha());

const renderProfile = async (formData) => {
  const tbody = document.querySelector("#info_table tbody");
  const data = await searchStudent(formData);

  tbody.innerHTML =
    data?.data?.map(
      (item) => `
    <tr>
      <td>${item.full_name}</td>
      <td>${moment(item.birth_date).format("DD/MM/YYYY")}</td>
      <td>${item.dept_name}</td>
      <td>${item.class_name}</td>
      <td>${item.sex == -1 ? "Nữ" : "Nam"}</td>
    </tr>
  `
    ) ?? "";

  btnLoad.innerHTML = renderButtons;
  document.getElementById("studentInfo").scrollIntoView();
  document
    .querySelector("#getStudentInfo")
    .addEventListener("click", () => callApi("info"));
  document
    .getElementById("getScore")
    .addEventListener("click", () => callApi());
};

const renderGrade = async (formData, semester = 1) => {
  const tbody = document.querySelector("#grade_table tbody");
  const data = await searchStudent(formData);
  tbody.innerHTML =
    data?.data?.kqhoctap
      ?.map(
        (item, index) => `
    <tr>
      <td>${item.subject_name}</td>
      <td>${semester == 3 ? item.grade_3_1 : item[`grade_${semester}_1M`]}</td>
      <td>${item[`grade_${semester}_2`]}</td>
      <td>${item[`grade_${semester}_3`]}</td>
      <td>${item[`grade_${semester}_4`]}</td>
    </tr>
  `
      )
      .join("") ?? "";
  btnLoad.innerHTML = renderButtons;
  document.getElementById("studentGrade").scrollIntoView();
  document
    .getElementById("getScore")
    .addEventListener("click", () => callApi());
  document
    .querySelector("#getStudentInfo")
    .addEventListener("click", () => callApi("info"));
};

getScore.addEventListener("click", () => callApi());
document
  .querySelector("#getStudentInfo")
  .addEventListener("click", () => callApi("info"));

semester.addEventListener("change", (e) => {
  if (!student_id.value || !isClicked) {
    // e.preventDefault();
    return;
  }
  const selectedSemester = semester.value; // Get the selected semester
  renderGrade(formData2, selectedSemester); // Re-render the table with the selected semester's grades
});

document.getElementById("year_desktop").innerHTML = new Date().getFullYear();
document.getElementById("year_mobile").innerHTML = new Date().getFullYear();

document
  .querySelector("#form")
  .addEventListener("submit", (e) => e.preventDefault());
