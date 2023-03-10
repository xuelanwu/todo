//console.log("hello world")

/*
  client side
    template: static template
    logic(js): MVC(model, view, controller): used to server side technology, single page application
        model: prepare/manage data,
        view: manage view(DOM),
        controller: business logic, event bindind/handling

  server side
    json-server
    CRUD: create(post), read(get), update(put, patch), delete(delete)


*/

//read
/* fetch("http://localhost:3000/todos")
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
    }); */

// const APIs = (() => {
//   const createTodo = (newTodo) => {
//     return fetch("http://localhost:3000/todos", {
//       method: "POST",
//       body: JSON.stringify(newTodo),
//       headers: { "Content-Type": "application/json" },
//     }).then((res) => res.json());
//   };

//   const deleteTodo = (id) => {
//     return fetch("http://localhost:3000/todos/" + id, {
//       method: "DELETE",
//     }).then((res) => res.json());
//   };

//   const getTodos = () => {
//     return fetch("http://localhost:3000/todos").then((res) => res.json());
//   };
//   return { createTodo, deleteTodo, getTodos };
// })();

const myFetch = async (url, options = {}) => {
  options.method = options.method || "GET";
  options.headers = options.headers || {};

  if (options.method.toUpperCase() !== "GET") {
    options.headers["Content-Type"] =
      options.headers["Content-Type"] || "application/json";
  }
  const res = await fetch(url, options);
  if (res.status >= 400) throw res;
  return res.json();
};

//IIFE
//todos
/*
    hashMap: faster to search
    array: easier to iterate, has order


*/
const Model = (() => {
  class State {
    #todos; //private field
    #pendingTodos;
    #completedTodos;
    #onChange; //function, will be called when setter function todos is called
    constructor() {
      this.#todos = [];
      this.#pendingTodos = [];
      this.#completedTodos = [];
    }
    get todos() {
      return this.#todos;
    }

    get pendingTodos() {
      return this.#pendingTodos;
    }

    get completedTodos() {
      return this.#completedTodos;
    }

    set todos(newTodos) {
      // reassign value
      this.#todos = newTodos;
      this.#onChange?.(); // rendering
    }

    set pendingTodos(pendingTodos) {
      // reassign value
      this.#pendingTodos = pendingTodos;
      this.#onChange?.(); // rendering
    }

    set completedTodos(completedTodos) {
      // reassign value
      this.#completedTodos = completedTodos;
      this.#onChange?.(); // rendering
    }

    subscribe(callback) {
      //subscribe to the change of the state todos
      this.#onChange = callback;
    }
  }

  const getTodos = async () => await myFetch("http://localhost:3000/todos");
  const createTodo = async (newTodo) =>
    await myFetch("http://localhost:3000/todos", {
      method: "POST",
      body: JSON.stringify(newTodo),
    });

  const updateTodo = async (updatedTodo) => {
    return await myFetch(`http://localhost:3000/todos/${updatedTodo.id}`, {
      method: "PUT",
      body: JSON.stringify(updatedTodo),
    });
  };
  const deleteTodo = async (todoId) =>
    await myFetch(`http://localhost:3000/todos/${todoId}`, {
      method: "DELETE",
    });

  return {
    State,
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
  };
})();
/*
    todos = [
        {
            id:1,
            content:"eat lunch"
        },
        {
            id:2,
            content:"eat breakfast"
        }
    ]

*/
const View = (() => {
  const pendingListEl = document.querySelector(".todo-list.pending");
  const completedListEl = document.querySelector(".todo-list.completed");
  const submitBtnEl = document.querySelector(".submit-btn");
  const inputEl = document.querySelector(".input");

  const renderPendingTodos = (todos) => {
    let pendingTemplate = "";
    // console.log("******** render p", todos);
    todos.forEach((todo) => {
      const liTemplate = `<li><span>${todo.content}</span><button class="edit-btn" id="${todo.id}">edit</button><button class="delete-btn" id="${todo.id}">delete</button><button class="move-btn" id="${todo.id}" value="${todo.content}">completed</button></li>`;
      pendingTemplate += liTemplate;
    });
    if (todos.length === 0) {
      pendingTemplate = "<h4>no pending task to display!</h4>";
    }
    pendingListEl.innerHTML = pendingTemplate;
  };
  const renderCompletedTodos = (todos) => {
    let completedTemplate = "";
    // console.log("******** render c", todos);
    todos.forEach((todo) => {
      const liTemplate = `<li><button class="move-btn" id="${todo.id}" value="${todo.content}">move</button><span>${todo.content}</span><button class="edit-btn" id="${todo.id}">edit</button><button class="delete-btn" id="${todo.id}">delete</button></li>`;
      completedTemplate += liTemplate;
    });
    if (todos.length === 0) {
      completedTemplate = "<h4>no completed task to display!</h4>";
    }

    completedListEl.innerHTML = completedTemplate;
  };

  const clearInput = () => {
    inputEl.value = "";
  };

  return {
    renderPendingTodos,
    renderCompletedTodos,
    submitBtnEl,
    inputEl,
    clearInput,
    pendingListEl,
    completedListEl,
  };
})();

const Controller = ((view, model) => {
  const state = new model.State();
  const init = () => {
    model.getTodos().then((todos) => {
      todos.reverse();
      state.todos = todos;
      let pendingTodos = [];
      let completedTodos = [];

      todos.forEach((todo) => {
        // console.log("************ todo", todo);
        return todo.completed
          ? completedTodos.push(todo)
          : pendingTodos.push(todo);
      });
      //   console.log("******** p todos", pendingTodos);
      //   console.log("******** c todos", completedTodos);
      state.pendingTodos = pendingTodos;
      state.completedTodos = completedTodos;
    });
  };

  const handleSubmit = () => {
    view.submitBtnEl.addEventListener("click", (event) => {
      /*
                1. read the value from input
                2. post request
                3. update view
            */
      const inputValue = view.inputEl.value;
      model
        .createTodo({ content: inputValue, completed: false })
        .then((data) => {
          state.todos = [data, ...state.todos];
          state.pendingTodos = [data, ...state.pendingTodos];
          view.clearInput();
        });
    });
  };

  const handleClick = () => {
    //event bubbling
    /*
            1. get id
            2. make delete request
            3. update view, remove
        */
    view.pendingListEl.addEventListener("click", (event) => {
      if (event.target.className === "delete-btn") {
        const id = event.target.id;
        // console.log("id", typeof id);
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
          state.pendingTodos = state.pendingTodos.filter(
            (todo) => todo.id !== +id
          );
        });
      } else if (event.target.className === "move-btn") {
        const id = event.target.id;
        const content = event.target.value;
        model.updateTodo({ id, content, completed: true }).then((data) => {
          state.pendingTodos = state.pendingTodos.filter(
            (todo) => todo.id !== +id
          );
          state.completedTodos = [data, ...state.completedTodos];
        });
      } else if (event.target.className === "edit-btn") {
        const id = event.target.id;
        const todoEl = event.target.parentNode.querySelector("span");
        todoEl.outerHTML = `<input class="input-box" id="${id}" type="text" value="${todoEl.innerText}"/>`;
        const editBtn = event.target;
        editBtn.className = "save-btn";
        // console.log("************* editBtn", editBtn.className);
        editBtn.addEventListener("click", (e) => {
          const updatedContent = document.querySelector(".input-box").value;
          //   console.log("******  UC", updatedContent.value);
          model
            .updateTodo({ id, content: updatedContent, completed: false })
            .then((data) => {
              state.todos = state.todos.map((todo) =>
                todo.id === data.id ? data : todo
              );
              state.pendingTodos = state.pendingTodos.map((todo) =>
                todo.id === data.id ? data : todo
              );
            });
        });
      }
    });

    view.completedListEl.addEventListener("click", (event) => {
      if (event.target.className === "delete-btn") {
        const id = event.target.id;
        // console.log("id", typeof id);
        model.deleteTodo(+id).then((data) => {
          state.todos = state.todos.filter((todo) => todo.id !== +id);
          state.completedTodos = state.completedTodos.filter(
            (todo) => todo.id !== +id
          );
        });
      } else if (event.target.className === "move-btn") {
        const id = event.target.id;
        const content = event.target.value;
        model.updateTodo({ id, content, completed: false }).then((data) => {
          state.completedTodos = state.completedTodos.filter(
            (todo) => todo.id !== +id
          );
          state.pendingTodos = [data, ...state.pendingTodos];
        });
      } else if (event.target.className === "edit-btn") {
        const id = event.target.id;
        const todoEl = event.target.parentNode.querySelector("span");
        todoEl.outerHTML = `<input class="input-box" id="${id}" type="text" value="${todoEl.innerText}"/>`;
        const editBtn = event.target;
        editBtn.className = "save-btn";
        // console.log("************* editBtn", editBtn.className);
        editBtn.addEventListener("click", (e) => {
          const updatedContent = document.querySelector(".input-box").value;
          //   console.log("******  UC", updatedContent.value);
          model
            .updateTodo({ id, content: updatedContent, completed: true })
            .then((data) => {
              state.todos = state.todos.map((todo) =>
                todo.id === data.id ? data : todo
              );
              state.completedTodos = state.completedTodos.map((todo) =>
                todo.id === data.id ? data : todo
              );
            });
        });
      }
    });
  };

  const bootstrap = () => {
    init();
    handleSubmit();
    handleClick();
    state.subscribe(() => {
      view.renderPendingTodos(state.pendingTodos);
      view.renderCompletedTodos(state.completedTodos);
    });
  };
  return {
    bootstrap,
  };
})(View, Model); //ViewModel

Controller.bootstrap();
