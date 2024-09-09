import { expressjwt, GetVerificationKey } from "express-jwt";
import jwks from 'jwks-rsa';



export const verifyJwt = expressjwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 25,
        jwksUri: 'https://dev-deslwdyelw63ku4q.us.auth0.com/.well-known/jwks.json'
    }) as GetVerificationKey,
    audience: 'this is an identifier',
    issuer: 'https://dev-deslwdyelw63ku4q.us.auth0.com/',
    algorithms: ['RS256']
});



