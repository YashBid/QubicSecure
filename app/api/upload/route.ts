import { NextRequest, NextResponse } from 'next/server';
import { saveContractFile } from '@/lib/utils/file-handler';
import { logger } from '@/lib/utils/logger';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        logger.info('UploadAPI', 'Received upload request');

        // On Vercel only /tmp is writable; locally use project folder
        const base = process.env.VERCEL ? '/tmp' : process.cwd();
        const uploadsDir = path.join(base, 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('📁 Upload received:', file.name, 'size:', file.size);

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        // Validate file extension
        const allowedExtensions = ['.cpp', '.h', '.hpp', '.c', '.cc', '.cxx'];
        const hasValidExtension = allowedExtensions.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            return NextResponse.json(
                { error: 'Invalid file type. Expected C++ source file (.cpp, .h, .hpp, .c)' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileInfo = await saveContractFile(buffer, file.name);

        console.log('✅ File saved to:', fileInfo.path);

        return NextResponse.json({
            success: true,
            fileId: fileInfo.id,
            fileName: file.name,
            fileHash: fileInfo.hash,
            filePath: fileInfo.path,
        });

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('❌ UPLOAD ERROR:', msg);
        logger.error('UploadAPI', 'Upload failed', { error: msg });
        return NextResponse.json({ error: 'Upload failed: ' + msg }, { status: 500 });
    }
}
