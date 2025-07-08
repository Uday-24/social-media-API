// utils/paginateCursor.js

/**
 * Apply cursor-based pagination on a Mongoose model.
 * @param {Object} options
 * @param {Mongoose.Model} options.model - Mongoose model to query
 * @param {Object} options.filter - Mongoose query filter
 * @param {String} options.cursor - Optional last _id to paginate from
 * @param {Number} options.limit - Number of documents to fetch
 * @param {Array} options.populate - Optional populate options
 * @param {Object} options.sort - Optional sort (default {_id: -1})
 * @returns {Object} - { results, nextCursor }
 */
const paginateCursor = async ({
  model,
  filter = {},
  cursor = null,
  limit = 10,
  populate = [],
  sort = { _id: -1 },
}) => {
  const query = { ...filter };
  if (cursor) {
    query._id = { $lt: cursor }; // Only fetch older documents
  }

  let dbQuery = model.find(query).sort(sort).limit(limit + 1);

  // Apply populate if provided
  if (populate.length > 0) {
    populate.forEach((p) => {
      dbQuery = dbQuery.populate(p);
    });
  }

  const docs = await dbQuery;
  const hasMore = docs.length > limit;
  const results = hasMore ? docs.slice(0, -1) : docs;
  const nextCursor = hasMore ? results[results.length - 1]._id : null;

  return {
    results,
    nextCursor,
  };
};

module.exports = paginateCursor;
