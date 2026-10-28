import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tinty – Asystent Kolorysty',
        short_name: 'Tinty',
        description: 'Cyfrowy asystent kolorysty fryzjerskiego: receptury, ważenie chemii i relacje z klientkami.',
        start_url: '/clients',
        display: 'standalone',
        background_color: '#f5f5f4',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}