const crypto = require("crypto");

const generateShortCode = (length = 8) => {
    return crypto
        .randomBytes(16)
        .toString("base64url")
        .slice(0, length);
};

module.exports = generateShortCode;