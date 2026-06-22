/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        // Next.js 14 key — prevents webpack from bundling pdfkit
        // so its internal Helvetica.afm font files resolve correctly at runtime
        serverComponentsExternalPackages: ['pdfkit'],
    },
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
}

module.exports = nextConfig
