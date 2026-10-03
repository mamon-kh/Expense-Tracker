const API_URL =
  "http://localhost:3000/api/expenses";


let expenses = [];

let editingId = null;


// =====================================
// Elements
// =====================================

const form =
  document.getElementById("expenseForm");

const titleInput =
  document.getElementById("title");

const amountInput =
  document.getElementById("amount");

const categoryInput =
  document.getElementById("category");

const dateInput =
  document.getElementById("date");

const filterInput =
  document.getElementById("filterCategory");

const tableBody =
  document.getElementById("expensesTableBody");

const spinner =
  document.getElementById("loadingSpinner");

const alertBox =
  document.getElementById("alertBox");

const submitButton =
  document.getElementById("submitButton");

const cancelButton =
  document.getElementById("cancelButton");


// =====================================
// Loading
// =====================================

function showLoading(show) {

  spinner.classList.toggle(
    "d-none",
    !show
  );

}


// =====================================
// Alert
// =====================================

function showAlert(
  message,
  type = "danger"
) {

  alertBox.className =
    `alert alert-${type}`;

  alertBox.textContent =
    message;

  alertBox.classList.remove(
    "d-none"
  );

}


function hideAlert() {

  alertBox.classList.add(
    "d-none"
  );

}


// =====================================
// API Helper
// =====================================

async function apiFetch(
  url,
  options = {}
) {

  showLoading(true);

  try {

    const response =
      await fetch(url, options);


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (!response.ok) {

      throw new Error(
        data.message ||
        `Request failed (${response.status})`
      );

    }


    return data;

  } finally {

    showLoading(false);

  }

}


// =====================================
// GET
// =====================================

async function getExpenses() {

  return await apiFetch(
    API_URL
  );

}


// =====================================
// POST
// =====================================

async function addExpense(data) {

  return await apiFetch(
    API_URL,
    {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(data)

    }
  );

}


// =====================================
// PUT
// =====================================

async function updateExpense(
  id,
  data
) {

  return await apiFetch(
    `${API_URL}/${id}`,
    {

      method: "PUT",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(data)

    }
  );

}


// =====================================
// DELETE
// =====================================

async function deleteExpense(id) {

  return await apiFetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE"
    }
  );

}


// =====================================
// Summary
// =====================================

function renderSummary(list) {

  const total =
    list.reduce(
      (sum, expense) =>
        sum + Number(expense.amount),
      0
    );


  document.getElementById(
    "totalAmount"
  ).textContent =
    total.toFixed(2);


  document.getElementById(
    "expenseCount"
  ).textContent =
    list.length;


  const highestValue =
    document.getElementById(
      "highestExpense"
    );

  const highestTitle =
    document.getElementById(
      "highestExpenseTitle"
    );


  if (list.length === 0) {

    highestValue.textContent =
      "0.00";

    highestTitle.textContent =
      "-";

    return;

  }


  const highestExpense =
    list.reduce(
      (highest, expense) => {

        if (
          Number(expense.amount) >
          Number(highest.amount)
        ) {

          return expense;

        }

        return highest;

      },
      list[0]
    );


  highestValue.textContent =
    Number(
      highestExpense.amount
    ).toFixed(2);


  highestTitle.textContent =
    highestExpense.title;

}


// =====================================
// Category Class
// =====================================

function getCategoryClass(category) {

  return `category-${category}`;

}


// =====================================
// Render Table
// =====================================

function renderTable(list) {

  if (list.length === 0) {

    tableBody.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="text-center text-muted py-4"
        >
          No expenses found.
        </td>

      </tr>

    `;

    return;

  }


  tableBody.innerHTML =
    list.map(expense => `

      <tr>

        <td>
          ${escapeHtml(
            expense.title
          )}
        </td>


        <td>
          ${Number(
            expense.amount
          ).toFixed(2)}
        </td>


        <td>

          <span
            class="
              category-badge
              ${getCategoryClass(
                expense.category
              )}
            "
          >

            ${escapeHtml(
              expense.category
            )}

          </span>

        </td>


        <td>
          ${escapeHtml(
            expense.date
          )}
        </td>


        <td>

          <div class="action-buttons">

            <button
              class="btn btn-sm btn-outline-secondary"
              onclick="startEdit(${expense.id})"
            >
              Edit
            </button>


            <button
              class="btn btn-sm btn-outline-danger"
              onclick="removeExpense(${expense.id})"
            >
              Delete
            </button>

          </div>

        </td>

      </tr>

    `).join("");

}


// =====================================
// Render Page
// =====================================

function render() {

  const selectedCategory =
    filterInput.value;


  let filteredExpenses;


  if (selectedCategory === "All") {

    filteredExpenses =
      expenses;

  } else {

    filteredExpenses =
      expenses.filter(
        expense =>
          expense.category ===
          selectedCategory
      );

  }


  renderSummary(
    filteredExpenses
  );


  renderTable(
    filteredExpenses
  );

}


// =====================================
// Refresh
// =====================================

async function refresh() {

  try {

    expenses =
      await getExpenses();


    render();

  } catch (error) {

    showAlert(
      error.message
    );

  }

}


// =====================================
// Form Data
// =====================================

function getFormData() {

  return {

    title:
      titleInput.value.trim(),

    amount:
      Number(
        amountInput.value
      ),

    category:
      categoryInput.value,

    date:
      dateInput.value

  };

}


// =====================================
// Reset Form
// =====================================

function resetForm() {

  form.reset();

  form.classList.remove(
    "was-validated"
  );


  editingId =
    null;


  submitButton.textContent =
    "Add expense";


  cancelButton.classList.add(
    "d-none"
  );

}


// =====================================
// Form Submit
// =====================================

form.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();


    if (!form.checkValidity()) {

      event.stopPropagation();

      form.classList.add(
        "was-validated"
      );

      return;

    }


    form.classList.add(
      "was-validated"
    );


    const data =
      getFormData();


    try {

      if (editingId === null) {

        await addExpense(data);


        showAlert(
          "Expense added successfully.",
          "success"
        );

      } else {

        await updateExpense(
          editingId,
          data
        );


        showAlert(
          "Expense updated successfully.",
          "success"
        );

      }


      resetForm();


      await refresh();

    } catch (error) {

      showAlert(
        error.message
      );

    }

  }
);


// =====================================
// Edit Expense
// =====================================

window.startEdit =
  function(id) {

    const expense =
      expenses.find(
        item =>
          item.id === id
      );


    if (!expense) {
      return;
    }


    editingId =
      id;


    titleInput.value =
      expense.title;


    amountInput.value =
      expense.amount;


    categoryInput.value =
      expense.category;


    dateInput.value =
      expense.date;


    submitButton.textContent =
      "Update expense";


    cancelButton.classList.remove(
      "d-none"
    );


    form.classList.remove(
      "was-validated"
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  };


// =====================================
// Cancel Edit
// =====================================

cancelButton.addEventListener(
  "click",
  function() {

    resetForm();

  }
);


// =====================================
// Delete Expense
// =====================================

window.removeExpense =
  async function(id) {

    const expense =
      expenses.find(
        item =>
          item.id === id
      );


    if (!expense) {
      return;
    }


    const confirmed =
      confirm(
        `Delete "${expense.title}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      await deleteExpense(id);


      showAlert(
        "Expense deleted successfully.",
        "success"
      );


      await refresh();

    } catch (error) {

      showAlert(
        error.message
      );

    }

  };


// =====================================
// HTML Safety
// =====================================

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =====================================
// Filter
// =====================================

filterInput.addEventListener(
  "change",
  function() {

    render();

  }
);


// =====================================
// Start Application
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    refresh();

  }
);