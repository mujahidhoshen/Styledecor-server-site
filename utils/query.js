export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '9', 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const getSort = (sort = 'newest') => {
  const map = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { cost: 1 },
    price_desc: { cost: -1 },
    name_asc: { service_name: 1 },
    name_desc: { service_name: -1 },
    date_asc: { bookingDate: 1 },
    date_desc: { bookingDate: -1 }
  };

  return map[sort] || map.newest;
};
