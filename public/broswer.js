window.onload = todoCreator;
let skip = 0;
function todoCreator() {
  console.log(skip);
  axios
    .get(`/read-item?skip=${skip}`)
    .then((res) => {
      const todoList = res.data.data;
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      skip += todoList.length;

      // console.log(todoList);
      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        todoList
          .map(
            (
              item
            ) => `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
      <span class="item-text"> ${item.todo}</span>
      <div>
      <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
      <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
      </div></li>`
          )
          .join("")
      );
    })
    .catch((error) => console.log(error));
}
// document.addEventListener("click", (e) => {
//   if (e.target.classList.contains("login")) {
//     console.log("login");
//     axios
//       .get("/login")
//       .then()
//       .catch((err) => alert(err));
//   } else if (e.target.classList.contains("signup")) {
//     console.log("signup");
//     axios
//       .get("/")
//       .then()
//       .catch((err) => alert(err));
//   }
// });
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-me")) {
    const todo = prompt("Enter new todo text");
    const todoId = e.target.getAttribute("data-id");
    axios
      .post("/edit-item", { todo, todoId })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.error);
          return;
        }
        e.target.parentElement.parentElement.querySelector(
          ".item-text"
        ).innerHTML = todo;
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("delete-me")) {
    const todoId = e.target.getAttribute("data-id");
    axios
      .post("/delete-item", { todoId })
      .then((res) => {
        if (res.data.status !== 201) {
          alert(res.data.error);
          return;
        }
        e.target.parentElement.parentElement.remove();
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("add_item")) {
    const todo = document.getElementById("create_field").value;
    // console.log(todo);
    axios
      .post("/create-item", { todo })
      .then((res) => {
        // console.log(res);
        if (res.data.status === 400) {
          alert(res.data.message);
          return;
        }
        document.getElementById("item_list").insertAdjacentHTML(
          "beforeend",
          `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
          <span class="item-text"> ${todo}</span>
          <div>
          <button data-id="${res.data.data._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
          <button data-id="${res.data.data._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
          </div></li>`
        );
      })
      .catch((err) => console.log(err));
  } else if (e.target.classList.contains("show_more")) {
    todoCreator();
  }
});
