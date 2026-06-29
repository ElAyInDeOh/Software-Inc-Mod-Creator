import { defineConfig } from 'vite'

export default defineConfig({
  // Serve all files from root
  root: '.',
  
  // Build output directory
  build: {
    outDir: 'dist',
    // Copy all static assets
    assetsDir: 'assets',
    // Don't try to bundle these - they're already static
    rollupOptions: {
      input: {
        main: 'index.html',
        software: 'software-type.html',
        company: 'company-type.html',
        names: 'name-generator.html',
        personalities: 'personalities.html',
        meta: 'meta-editor.html'
      }
    }
  },

  server: {
    // Allow access from other devices on the network
    host: true,
    
    // Default port
    port: 8080,
    
    // Optional: Proxy AI API requests to avoid CORS
    // Uncomment and configure if needed:
    // proxy: {
    //   '/api/openai': {
    //     target: 'https://api.openai.com',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api\/openai/, '')
    //   }
    // }
  },

  preview: {
    host: true,
    port: 8080
  }
})
