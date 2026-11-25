const mongoose = require("mongoose");
const Click = require("../models/clickEvent.schema");
const Url = require("../models/url.schema");
const AppError = require("../utils/AppError");

const BREAKDOWN_LIMIT = 6;

function breakdownPipeline(field) {
  return [
    { $group: { _id: `$${field}`, clicks: { $sum: 1 } } },
    { $sort: { clicks: -1, _id: 1 } },
    { $limit: BREAKDOWN_LIMIT },
    { $project: { _id: 0, label: { $ifNull: ["$_id", "Unknown"] }, clicks: 1 } },
  ];
}

exports.getUserAnalytics = async (req, res) => {
  const range = req.query.range || "7";
  if (!["7", "30", "all"].includes(range)) {
    throw new AppError("Range must be 7, 30, or all", 400);
  }

  const match = { userId: new mongoose.Types.ObjectId(req.userId) };
  const urls = await Url.find({ userId: req.userId }).select("_id");
  const linkIds = urls.map((url) => url._id);

  if (req.query.linkId) {
    if (!mongoose.isValidObjectId(req.query.linkId)) {
      throw new AppError("Invalid link id", 400);
    }

    const url = urls.find((item) => item._id.toString() === req.query.linkId);
    if (!url) throw new AppError("URL not found", 404);
    match.linkId = url._id; 
  } else {
    match.linkId = { $in: linkIds };
  }

  if (range !== "all") {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(range));
    match.createdAt = { $gte: startDate };
  }

  const [result = { summary: [], countries: [], devices: [], referrers: [], daily: [] }] =
    await Click.aggregate([
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalClicks: { $sum: 1 },
              },
            },
            { $project: { _id: 0, totalClicks: 1 } },
          ],
          countries: breakdownPipeline("country"),
          devices: [
            {
              $group: {
                _id: { device: "$device", browser: "$browser" },
                clicks: { $sum: 1 },
              },
            },
            { $sort: { clicks: -1, "_id.device": 1 } },
            { $limit: BREAKDOWN_LIMIT },
            {
              $project: {
                _id: 0,
                label: { $ifNull: ["$_id.device", "Unknown"] },
                detail: { $ifNull: ["$_id.browser", "Unknown"] },
                clicks: 1,
              },
            },
          ],
          referrers: breakdownPipeline("referrer"),
          daily: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                clicks: { $sum: 1 },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 365 },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: "$_id", clicks: 1 } },
          ],
        },
      },
    ]);
  const [uniqueVisitorResult] = await Click.aggregate([
    { $match: { ...match, visitorHash: { $ne: null } } },
    { $group: { _id: "$visitorHash" } },
    { $count: "uniqueVisitors" },
  ]);
  let previousPeriodClicks = null;
  if (range !== "all") {
    const now = new Date();
    const periodMs = Number(range) * 24 * 60 * 60 * 1000;
    const currentPeriodStart = new Date(now.getTime() - periodMs);
    const previousPeriodStart = new Date(now.getTime() - periodMs * 2);
    previousPeriodClicks = await Click.countDocuments({
      ...match,
      createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    });
  }

  return res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalClicks: result.summary[0]?.totalClicks || 0,
        uniqueVisitors: uniqueVisitorResult?.uniqueVisitors || 0,
      },
      countries: result.countries,
      devices: result.devices,
      referrers: result.referrers,
      daily: result.daily,
      previousPeriodClicks,
    },
  });
};
