module.exports = async (Model, filter, req, { populate, sort = { createdAt: -1 }, select } = {}) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  let query = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  if (populate) query = query.populate(populate);
  if (select) query = query.select(select);
  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, page, pages: Math.max(Math.ceil(total / limit), 1), total };
};
