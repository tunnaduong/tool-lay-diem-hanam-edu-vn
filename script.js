import { searchStudent } from "./services.js";

const getScore = document.querySelector("#getScore");
const error_message = document.querySelector("#error_message");
const student_id = document.querySelector("#student_id");
const year = document.querySelector("#year");
const semester = document.querySelector("#semester");

var formData = new FormData();
var formData2 = new FormData();
var isClicked = false;

const callApi = async () => {
  error_message.textContent = "";

  isClicked = true;

  // HEAD1259168
  formData.append("year", year.value);
  formData.append("semesterid", semester.value);
  console.log(semester.value);
  formData.append("id", student_id.value);
  formData.append("ma", "okmhh");
  formData.append("action", "search");

  renderProfile(formData);

  formData2.append("year", year.value);
  formData2.append("sem", semester.value);
  console.log(semester.value);
  formData2.append("studentid", student_id.value);
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
