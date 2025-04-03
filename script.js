import { searchStudent, insertCaptcha, getCaptcha } from "./services.js";

const getScore = document.querySelector("#getScore");
const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const year = document.querySelector("#year");
const semester = document.querySelector("#semester");
const btnLoad = document.querySelector("#btnLoad");
const captcha_code = document.querySelector("#captcha_code");

var formData = new FormData();
var formData2 = new FormData();
var isClicked = false;

const callApi = async (type = "grade") => {
  error_message.textContent = "";

  btnLoad.innerHTML = `
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
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
  document.querySelector("#capcha").src =
    "https://cors.21112003.xyz/https://hanam.edu.vn/get_captcha.php?_=1729685557806&keycode=_search_eos";
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

  btnLoad.innerHTML = `
      <button id="getScore" class="btn btn-primary">Lấy điểm</button>
      <button id="getStudentInfo" class="btn btn-secondary">
            Lấy thông tin học sinh
          </button>
      `;
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
      <th scope="row">${index + 1}</th>
      <td>${item.subject_name}</td>
      <td>${semester == 3 ? item.grade_3_1 : item[`grade_${semester}_1M`]}</td>
      <td>${item[`grade_${semester}_2`]}</td>
      <td>${item[`grade_${semester}_3`]}</td>
      <td>${item[`grade_${semester}_4`]}</td>
    </tr>
  `
      )
      .join("") ?? "";
  btnLoad.innerHTML = `
      <button id="getScore" class="btn btn-primary">Lấy điểm</button>
      <button id="getStudentInfo" class="btn btn-secondary">
            Lấy thông tin học sinh
          </button>
      `;
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
