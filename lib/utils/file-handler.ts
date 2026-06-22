import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// On Vercel (serverless), only /tmp is writable. Locally, use project uploads/temp folders.
const TMP_BASE = process.env.VERCEL ? '/tmp' : process.cwd();
const UPLOAD_DIR = path.join(TMP_BASE, 'uploads');
const TEMP_DIR = path.join(TMP_BASE, 'temp');

/**
 * Initialize storage directories
 */
export async function initializeStorage() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
}

/**
 * Save uploaded contract file
 */
export async function saveContractFile(fileBuffer: Buffer, originalName: string): Promise<{ id: string; path: string; hash: string }> {
    await initializeStorage();

    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const fileId = crypto.randomUUID();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await fs.writeFile(filePath, fileBuffer);

    return {
        id: fileId,
        path: filePath,
        hash: fileHash,
    };
}

/**
 * Read contract file
 */
export async function readContractFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
}

/**
 * Delete contract file
 */
export async function deleteContractFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

/**
 * Clean up old files (older than 24 hours)
 */
export async function cleanupOldFiles(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const dir of [UPLOAD_DIR, TEMP_DIR]) {
        try {
            const files = await fs.readdir(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.error(`Error cleaning up ${dir}:`, error);
        }
    }
}

/**
 * Generate file hash
 */
export function generateFileHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}
