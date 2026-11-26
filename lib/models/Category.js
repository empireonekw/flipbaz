import mongoose from "mongoose";
import { defineModel } from "./define.js";

/**
 * A product category, e.g. "Boxing Gear".
 *
 * @typedef {Object} Category
 * @property {string} name
 * @property {string} slug         unique, used in catalog filter URLs
 * @property {string} [image]      storage URL
 * @property {string} [description]
 * @property {number} sortOrder    lower shows first
 */
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category =
  defineModel("Category", CategorySchema);
export default Category;
