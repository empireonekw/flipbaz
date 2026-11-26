import mongoose from "mongoose";

/**
 * Register a Mongoose model, safely across hot reloads.
 *
 * In production each module runs once, so an existing model is reused. In
 * development, Next re-evaluates model files on every edit; reusing the cached
 * model would keep the OLD schema, and Mongoose's strict mode would then
 * silently drop any newly added fields. So in dev the stale model is deleted
 * and re-registered with the current schema.
 *
 * @param {string} name
 * @param {import("mongoose").Schema} schema
 * @returns {import("mongoose").Model<any>}
 */
export function defineModel(name, schema) {
  if (mongoose.models[name]) {
    if (process.env.NODE_ENV === "production") return mongoose.models[name];
    mongoose.deleteModel(name);
  }
  return mongoose.model(name, schema);
}
