const Course = require("../models/courses.model");

const searchByTitle = (q) => Course.find({ title: { $regex: q, $options: "i" } });

const findByIds = (ids, sort) => {
  const query = Course.find({ _id: { $in: ids } });
  return sort ? query.sort(sort) : query;
};

const count = (filter) => Course.countDocuments(filter);

// limit 0 means "no limit" in mongoose
const findPage = (filter, sort, skip, limit) =>
  Course.find(filter, { __v: 0 }).sort(sort).skip(skip).limit(limit);

const findLatest = (limit) => Course.find().sort({ createdAt: -1 }).limit(limit);

const findById = (id) => Course.findById(id);

const create = (data) => Course.create(data);

const updateById = (id, update, options) => Course.findByIdAndUpdate(id, update, options);

const deleteById = (id) => Course.findOneAndDelete({ _id: id });

module.exports = {
  searchByTitle,
  findByIds,
  count,
  findPage,
  findLatest,
  findById,
  create,
  updateById,
  deleteById,
};
