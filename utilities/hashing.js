import { compare } from "bcryptjs";
import { hash } from "bcryptjs"
import createHmac from 'crypto'
const doHash = (value, saltValue) => {
    const result = hash(value, saltValue)
    return result
}
export default doHash;
export function decryptHashedPassword(value, hashedValue) {
    const result = compare(value, hashedValue)
    return result
}
export function hmacProcess(value, key) {
    const result = createHmac('sha256', key).update(value).digest('hex')
    return result
}