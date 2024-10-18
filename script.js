import { searchStudent, getCommit } from "./services.js";

const getScore = document.querySelector("#getScore");
const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const year = document.querySelector("#year");
const semester = document.querySelector("#semester");
const btnLoad = document.querySelector("#btnLoad");

var formData = new FormData();
var formData2 = new FormData();
var isClicked = false;

const callApi = async () => {
  error_message.textContent = "";

  btnLoad.innerHTML = `
  <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>
  `;

  isClicked = true;

  // HEAD1259168
  formData.append("year", year.value);
  formData.append("semesterid", semester.value);
  formData.append("id", student_id.value.toUpperCase());
  formData.append("ma", "okmhh");
  formData.append("action", "search");

  renderProfile(formData);

  formData2.append("year", year.value);
  formData2.append("sem", semester.value);
  formData2.append("studentid", student_id.value.toUpperCase());
  formData2.append("action", "show_gradess");

  renderGrade(formData2, semester.value);
};

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
      `;
  document
    .getElementById("getScore")
    .addEventListener("click", () => callApi());
};

getScore.addEventListener("click", () => callApi());

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

async function getCommitTime() {
  const lastUpdate = document.querySelector("#last_updated");
  const lastUpdateTime = await getCommit();

  lastUpdate.textContent =
    "Cập nhật lần cuối: " +
    moment(lastUpdateTime)
      .tz("Asia/Ho_Chi_Minh") // Set to Vietnam timezone (UTC+7)
      .format("h:mm A, DD/MM/YYYY");
}

getCommitTime();

// Function to check the current URL and redirect if necessary
function checkAndRedirect() {
  const desiredUrl = "https://diemthi.tunnaduong.com/";
  const currentUrl = window.location.href;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Check if the current URL is not the desired URL and not on localhost
  if (currentUrl !== desiredUrl && !isLocalhost) {
    // Redirect to the desired URL
    window.location.href = desiredUrl;
  }
}

checkAndRedirect();
