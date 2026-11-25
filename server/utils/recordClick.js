const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const Click = require('../models/clickEvent.schema');
const Url = require('../models/url.schema');

const recordClick = async ({ linkId,userId, userAgent, referer, ip }) => {
  try {
    // 1. Detect Device (Mobile, Tablet, or Desktop) and Browser
    const parser = new UAParser(userAgent);
    const rawDevice = parser.getDevice().type || 'Desktop';
    const device = rawDevice.charAt(0).toUpperCase() + rawDevice.slice(1);
    const browser = parser.getBrowser().name || 'Unknown';

    // 2. Clean up the Referrer (e.g., turns "https://www.linkedin.com/feed" into "linkedin.com")
    let referrer = 'Direct';
    if (referer) {
      try {
        referrer = new URL(referer).hostname.replace('www.', '');
      } catch {
        referrer = 'Direct';
      }
    }

    // 3. Detect Country from IP (Note: on localhost, IP is ::1 so country will be 'Unknown' until deployed)
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : 'Unknown';
    const visitorHash = ip
      ? crypto
          .createHmac('sha256', process.env.JWT_SECRET)
          .update(`${ip}|${userAgent || ''}`)
          .digest('hex')
      : null;

    // 4. Save both the Click document and +1 on the Link document in parallel
    await Promise.all([
      Click.create({ linkId, userId, visitorHash, country, device, browser, referrer }),
      Url.findByIdAndUpdate(linkId, { $inc: { clickCount: 1 } }),
    ]);

    console.log(`✅ Background analytics saved for link: ${linkId}`);
  } catch (error) {
    console.error('❌ Background analytics error:', error.message);
  }
};

module.exports = recordClick;