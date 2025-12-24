import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

// Standards: SHA-256 for integrity, AES-256-GCM for encryption

/**
 * Calculates the SHA-256 checksum of a file or buffer.
 */
export async function calculateFileHash(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    await pipeline(stream, hash);
    return hash.digest('hex');
}

export function calculateBufferHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Encrypts a buffer using AES-256-GCM.
 * Returns the IV, Auth Tag, and Encrypted Data concatenated as hex or separated.
 */
export function encryptData(data: Buffer, key: Buffer): { iv: string; tag: string; content: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        content: encrypted.toString('hex'),
    };
}

/**
 * Decrypts data using AES-256-GCM.
 */
export function decryptData(encrypted: string, ivHex: string, tagHex: string, key: Buffer): Buffer {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'hex')),
        decipher.final()
    ]);
}

/**
 * Generates a secure random 256-bit key for AES.
 */
export function generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
}
