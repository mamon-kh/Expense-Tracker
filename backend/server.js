// Expense Tracker - Backend
// Express + PostgreSQL

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());


// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});


// Allowed categories
const allowedCategories = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Other"
];


// Check ID
function validId(id) {
  return /^\d+$/.test(String(id)) && Number(id) > 0;
}


// Validate expense data
function validateExpense(data) {

  const {
    title,
    amount,
    category,
    date
  } = data;


  if (
    typeof title !== "string" ||
    title.trim() === ""
  ) {
    return "Title is required.";
  }


  if (title.trim().length > 100) {
    return "Title must be 100 characters or less.";
  }


  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    return "Amount must be greater than 0.";
  }


  if (!allowedCategories.includes(category)) {
    return "Invalid category.";
  }


  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return "Date must be in YYYY-MM-DD format.";
  }


  return null;
}


// ======================================
// GET ALL EXPENSES
// ======================================

app.get("/api/expenses", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      ORDER BY date DESC, id DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch expenses."
    });

  }

});


// ======================================
// GET ONE EXPENSE
// ======================================

app.get("/api/expenses/:id", async (req, res) => {

  if (!validId(req.params.id)) {

    return res.status(400).json({
      message: "Invalid expense id."
    });

  }


  try {

    const result = await pool.query(`
      SELECT
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'YYYY-MM-DD') AS date
      FROM expenses
      WHERE id = $1
    `, [
      Number(req.params.id)
    ]);


    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Expense not found."
      });

    }


    res.status(200).json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch expense."
    });

  }

});


// ======================================
// ADD EXPENSE
// ======================================

app.post("/api/expenses", async (req, res) => {

  const errorMessage =
    validateExpense(req.body);


  if (errorMessage) {

    return res.status(400).json({
      message: errorMessage
    });

  }


  const {
    title,
    amount,
    category,
    date
  } = req.body;


  try {

    const result = await pool.query(`
      INSERT INTO expenses
        (title, amount, category, date)

      VALUES
        ($1, $2, $3, $4)

      RETURNING
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'YYYY-MM-DD') AS date
    `, [
      title.trim(),
      Number(amount),
      category,
      date
    ]);


    res.status(201).json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to add expense."
    });

  }

});


// ======================================
// UPDATE EXPENSE
// ======================================

app.put("/api/expenses/:id", async (req, res) => {

  if (!validId(req.params.id)) {

    return res.status(400).json({
      message: "Invalid expense id."
    });

  }


  const errorMessage =
    validateExpense(req.body);


  if (errorMessage) {

    return res.status(400).json({
      message: errorMessage
    });

  }


  const {
    title,
    amount,
    category,
    date
  } = req.body;


  try {

    const result = await pool.query(`
      UPDATE expenses

      SET
        title = $1,
        amount = $2,
        category = $3,
        date = $4

      WHERE id = $5

      RETURNING
        id,
        title,
        amount::float8 AS amount,
        category,
        to_char(date, 'YYYY-MM-DD') AS date
    `, [
      title.trim(),
      Number(amount),
      category,
      date,
      Number(req.params.id)
    ]);


    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Expense not found."
      });

    }


    res.status(200).json(result.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to update expense."
    });

  }

});


// ======================================
// DELETE EXPENSE
// ======================================

app.delete("/api/expenses/:id", async (req, res) => {

  if (!validId(req.params.id)) {

    return res.status(400).json({
      message: "Invalid expense id."
    });

  }


  try {

    const result = await pool.query(`
      DELETE FROM expenses
      WHERE id = $1
      RETURNING id
    `, [
      Number(req.params.id)
    ]);


    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Expense not found."
      });

    }


    res.status(200).json({
      message: "Expense deleted successfully."
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to delete expense."
    });

  }

});


// ======================================
// START SERVER
// ======================================

app.listen(PORT, () => {

  console.log(
    `Expense Tracker API running at http://localhost:${PORT}`
  );

});