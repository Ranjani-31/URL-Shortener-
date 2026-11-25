const Url = require('../models/url.schema');
const Click = require('../models/clickEvent.schema');
const AppError = require('../utils/AppError');
const  generateShortCode  = require('../utils/generateShortCode');
 const recordClick = require('../utils/recordClick');
const FREE_MONTHLY_LINK_LIMIT = 25;

 function serializeUrl(url) {
   return {
      _id: url._id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      clickCount: url.clickCount,
      isActive: url.isActive,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
   };
}

exports.getUserUrls = async (req, res) => {
   const urls = await Url.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('originalUrl shortCode clickCount isActive createdAt expiresAt');

   return res.status(200).json({
      status: "success",
      data: urls.map((url) => (serializeUrl(url))),
   });
}


exports.createShortUrl = async (req, res) => {
   const {id, plan} = req.user;

   const { originalUrl, alias, expiresAt } = req.validatedBody;
    if (plan === 'free' && (alias || expiresAt)) {
      throw new AppError("Free users cannot set custom aliases or expiration dates.", 400);
    }

   if (plan === 'free') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const linksCreatedThisMonth = await Url.countDocuments({
         userId: id,
         createdAt: { $gte: monthStart, $lt: nextMonthStart },
      });

      if (linksCreatedThisMonth >= FREE_MONTHLY_LINK_LIMIT) {
         throw new AppError("Free users can create up to 25 links per month. Upgrade to Pro to create more.", 429);
      }
   }

   const shortCode = alias ? alias.trim().toLowerCase() : generateShortCode();

   const url = await Url.create({
      userId: id,
      originalUrl,
      shortCode,
      ...(expiresAt && { expiresAt: new Date(expiresAt) }),
   });
    
   return res.status(201).json({
      status: "success",
      data: serializeUrl(url),
   });
}

exports.updateUserUrl = async (req, res) => {
    if (req.user.plan==='free') {
    throw new AppError("Free users cannot update URL settings.", 403); 
   }
   const url = await Url.findOne({
      _id: req.params.id,
      userId: req.user.id,
   });

   if (!url) {
      throw new AppError("URL not found", 404);
   } 

   const { originalUrl, expiresAt, isActive } = req.validatedBody;
   const nextExpiresAt = expiresAt ? new Date(expiresAt) : null;
   const nextIsActive = isActive ?? url.isActive;
   if (nextIsActive && nextExpiresAt && nextExpiresAt <= new Date()) {
      throw new AppError("This URL has expired. Set a future expiration date before activating it.", 400);
   }

   url.originalUrl = originalUrl;
   url.expiresAt = nextExpiresAt;
   url.isActive = nextIsActive;
   await url.save();

   return res.status(200).json({
      status: "success",
      data: serializeUrl(url),
   });
}

exports.updateUserUrlStatus = async (req, res) => {
   const url = await Url.findOne({
      _id: req.params.id,
      userId: req.user.id,
   });

   if (!url) {
      throw new AppError("URL not found", 404);
   }

   const { isActive } = req.validatedBody;
   if (isActive && url.expiresAt && url.expiresAt <= new Date()) {
      throw new AppError("This URL has expired.", 400);
   }

   url.isActive = isActive;
   await url.save();

   return res.status(200).json({
      status: "success",
      data: serializeUrl(url),
   });
}


exports.deleteUserUrl = async (req, res) => {
   const url = await Url.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
   });

   if (!url) {
      throw new AppError("URL not found", 404);
   }

   await Click.deleteMany({ linkId: url._id, userId: req.user.id });

   return res.status(200).json({
      status: "success",
      message: "URL deleted successfully",
   });
}

exports.redirectUrl = async (req, res) => {
    const { shortCode } = req.params;

    const url = await Url.findOne({
        shortCode,
        isActive: true,
    });

    if (!url) {
        throw new AppError("URL not found", 404);
    }

    if (url.expiresAt && url.expiresAt <= new Date()) {
        throw new AppError("URL has expired", 410);
    }
const clickData = {
      linkId: url._id,
      userId: url.userId,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'] || req.headers['referrer'],
      ip: req.ip,
    };
    recordClick(clickData);
    return res.redirect(302, url.originalUrl);
};