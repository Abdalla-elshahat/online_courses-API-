// strips MongoDB operators ($ne, $gt, $where...) and dotted keys from user input to block NoSQL injection
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.keys(value).reduce((out, key) => {
      if (!key.startsWith("$") && !key.includes(".")) out[key] = clean(value[key]);
      return out;
    }, {});
  }
  return value;
};

module.exports = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    const query = clean(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, query);
  }
  next();
};
