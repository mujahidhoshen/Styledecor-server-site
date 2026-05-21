import { Service } from '../models/Service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, getPagination, getSort, normalizeSearch } from '../utils/query.js';

const buildServiceFilter = (query) => {
  const { type, minPrice, maxPrice } = query;
  const search = normalizeSearch(query.search);
  const conditions = [];

  if (search) {
    const pattern = escapeRegex(search);
    conditions.push({
      $or: [
        { service_name: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } }
      ]
    });
  }

  if (type) {
    conditions.push({
      $or: [{ service_category: type }, { service_type: type }]
    });
  }

  if (minPrice || maxPrice) {
    const cost = {};
    if (minPrice && Number.isFinite(Number(minPrice))) cost.$gte = Number(minPrice);
    if (maxPrice && Number.isFinite(Number(maxPrice))) cost.$lte = Number(maxPrice);
    conditions.push({ cost });
  }

  return conditions.length ? { $and: conditions } : {};
};

export const getServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildServiceFilter(req.query);
  const sort = getSort(req.query.sort);

  const [data, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  });
});

export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).lean();

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  res.json({
    success: true,
    data: service
  });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create({
    ...req.body,
    createdByEmail: req.user.email
  });

  res.status(201).json({
    success: true,
    message: 'Service created.',
    data: service
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  res.json({
    success: true,
    message: 'Service updated.',
    data: service
  });
});

export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  res.json({
    success: true,
    message: 'Service deleted.',
    data: service
  });
});
