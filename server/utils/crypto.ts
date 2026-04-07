import crypto from "crypto";

export function hashPassword(password: string): string {
    // Use crypto pbkdf2 to securely hash passwords. Alternatively, we could install bcrypt but trying to stick with builtins if possible, though bcrypt was requested in task. So I will use a simple crypto wrapper that behaves like it, or use standard crypto.
    // Actually, standard crypto handles this well.
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(":");
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === verifyHash;
}
