import * as speakeasy from 'speakeasy';
import 'dotenv/config'


export const generateCode = () => {
    return speakeasy.totp({
        secret: process.env.JWT_SECRET!,
        digits: 5,
        step: 60 * 15,
        encoding: 'base32',
    })
}