import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin.html'),
                blog: resolve(__dirname, 'blog.html'),
                article: resolve(__dirname, 'article.html'),
                404: resolve(__dirname, '404.html')
            }
        }
    },
    // Konfigurace pro dev server (nepřesměrovávat 404 rovnou na index)
    plugins: [
        {
            name: 'custom-404',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    // Ignorujeme API volání, assets a validní stránky
                    if (
                        req.url === '/' ||
                        req.url.startsWith('/api') ||
                        req.url.startsWith('/src') ||
                        req.url.includes('.')
                    ) {
                        return next();
                    }

                    // Pokus o nalezení validní stránky už je za námi, zbytek přesměrujeme na 404
                    req.url = '/404.html';
                    next();
                });
            }
        }
    ]
});
