import { compare } from "bcryptjs";
import { hash } from "bcryptjs"

const doHash = (value, saltValue) => {
    const result = hash(value, saltValue)
    return result
}
export default doHash;

export function decryptHashedPassword(value, hashedValue) {
    const result = compare(value, hashedValue)
    return result
}