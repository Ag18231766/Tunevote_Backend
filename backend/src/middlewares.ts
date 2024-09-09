import { expressjwt, GetVerificationKey } from "express-jwt";
import jwks from 'jwks-rsa';
import dotenv from "dotenv";
dotenv.config();


export const verifyJwt = expressjwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 25,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }) as GetVerificationKey,
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});



