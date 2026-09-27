import Policy from '../models/Policy.js';

async function searchByUsername(username, { page = null, limit = null } = {}) {
  const sanitized = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const basePipeline = [
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $match: {
        $or: [
          { 'user.firstName': { $regex: sanitized, $options: 'i' } },
          { 'user.email': { $regex: sanitized, $options: 'i' } },
        ],
      },
    },
    {
      $lookup: {
        from: 'policycategories',
        localField: 'policyCategoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $lookup: {
        from: 'policycarriers',
        localField: 'carrierId',
        foreignField: '_id',
        as: 'carrier',
      },
    },
    { $unwind: '$carrier' },
    {
      $project: {
        _id: 0,
        policyNumber: 1,
        policyStartDate: 1,
        policyEndDate: 1,
        user: {
          _id: '$user._id',
          firstName: '$user.firstName',
          email: '$user.email',
        },
        policyCategory: '$category.categoryName',
        carrier: '$carrier.companyName',
      },
    },
  ];

  if (!page && !limit) {
    return Policy.aggregate(basePipeline);
  }

  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.max(1, Number(limit) || 10);
  const skip = (currentPage - 1) * currentLimit;

  const result = await Policy.aggregate([
    basePipeline[0],
    basePipeline[1],
    basePipeline[2],
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: currentLimit },
          basePipeline[3],
          basePipeline[4],
          basePipeline[5],
          basePipeline[6],
          basePipeline[7],
        ],
      },
    },
  ]);

  const total = result[0]?.metadata[0]?.total || 0;
  const data = result[0]?.data || [];

  return {
    data,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      totalRecords: total,
      totalPages: Math.ceil(total / currentLimit) || 1,
    },
  };
}

async function aggregateByUser({ page = null, limit = null } = {}) {
  const groupStage = {
    $group: {
      _id: '$userId',
      policyCount: { $sum: 1 },
      policies: {
        $push: {
          policyNumber: '$policyNumber',
          policyStartDate: '$policyStartDate',
          policyEndDate: '$policyEndDate',
          policyCategoryId: '$policyCategoryId',
          carrierId: '$carrierId',
        },
      },
    },
  };

  const lookupStage = {
    $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
  };

  const projectStage = {
    $project: {
      _id: 0,
      userId: '$_id',
      userName: '$user.firstName',
      email: '$user.email',
      policyCount: 1,
      policies: 1,
    },
  };

  if (!page && !limit) {
    return Policy.aggregate([
      groupStage,
      lookupStage,
      { $unwind: '$user' },
      projectStage,
      { $sort: { policyCount: -1, userName: 1 } },
    ]);
  }

  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.max(1, Number(limit) || 10);
  const skip = (currentPage - 1) * currentLimit;

  const result = await Policy.aggregate([
    groupStage,
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { policyCount: -1 } },
          { $skip: skip },
          { $limit: currentLimit },
          lookupStage,
          { $unwind: '$user' },
          projectStage,
        ],
      },
    },
  ]);

  const total = result[0]?.metadata[0]?.total || 0;
  const data = result[0]?.data || [];

  return {
    data,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      totalRecords: total,
      totalPages: Math.ceil(total / currentLimit) || 1,
    },
  };
}

export default { searchByUsername, aggregateByUser };
