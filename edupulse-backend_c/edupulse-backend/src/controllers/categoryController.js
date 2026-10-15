const asyncHandler = require('express-async-handler');
const { pool } = require('../config/db');

// @desc    List categories (public to any authenticated user)
// @route   GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, (SELECT COUNT(*) FROM courses co WHERE co.category_id = c.category_id) AS courses_count
     FROM categories c ORDER BY category_name ASC`
  );
  res.json({ success: true, count: rows.length, categories: rows });
});

// @desc    Create a category
// @route   POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { category_name, description } = req.body;
  if (!category_name) {
    res.status(400);
    throw new Error('category_name is required');
  }
  const [result] = await pool.execute(
    'INSERT INTO categories (category_name, description) VALUES (:name, :description)',
    { name: category_name, description: description || null }
  );
  const [rows] = await pool.execute('SELECT * FROM categories WHERE category_id = :id', { id: result.insertId });
  res.status(201).json({ success: true, category: rows[0] });
});

// @desc    Update a category
// @route   PATCH /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { category_name, description } = req.body;
  const fields = [];
  const params = { id: req.params.id };
  if (category_name !== undefined) { fields.push('category_name = :name'); params.name = category_name; }
  if (description !== undefined) { fields.push('description = :description'); params.description = description; }
  if (!fields.length) {
    res.status(400);
    throw new Error('No updatable fields provided');
  }
  const [result] = await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE category_id = :id`, params);
  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Category not found');
  }
  const [rows] = await pool.execute('SELECT * FROM categories WHERE category_id = :id', { id: req.params.id });
  res.json({ success: true, category: rows[0] });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM categories WHERE category_id = :id', { id: req.params.id });
  if (!result.affectedRows) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
