import { defineConfig, normalizePath } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

const createConfig = async (outDir: string) => ({
  plugins: [
    (await import('vite-plugin-static-copy')).viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/va
d-web/dist/vad.worklet.bundle.min.js')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/va
d-web/dist/silero_vad_v5.onnx')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/va
d-web/dist/silero_vad_legacy.onnx')),
          dest: './libs/',
        },
        {
          src: normalizePath(path.resolve(__dirname, 'node_modules/onnxruntime-w
eb/dist/*.wasm')),
          dest: './libs/',
        },
      ],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Adjusted for web structure
    },
  },
  root: 'src', // Adjusted for web structure
  publicDir: '../public', // Adjusted relative to new root, or use path.join(__dirname, 'public')
  base: './',
  server: {
    port: 3000,
  },
  build: {
    outDir: path.join(__dirname, '..', outDir), // Adjusted for new root, outDir is relative to project root
    emptyOutDir: true,
    assetsDir: 'assets', // This will be inside outDir
    rollupOptions: {
      input: {
        // main path is now relative to the new root ('src'), so index.html is in '../public'
        main: path.resolve(__dirname, '../public/index.html'),
      },
    },
  },
  ssr: {
    noExternal: ['vite-plugin-static-copy'],
  },
});

export default defineConfig(async ({ mode }) => {
  // Simplified: always build for web, outDir is now 'dist/web' from createConfig
  // The mode distinction might not be necessary anymore if only building for web.
  // Let's assume 'dist/web' is the desired default output.
  if (mode === 'web') { // This mode is set by `npm run build` script in package.json
    return createConfig('../dist/web'); // Output to frontend/dist/web
  }
  // Default to web build if mode is not specified or different
  return createConfig('../dist'); // Output to frontend/dist for general dev
});

// Note: The original createConfig function takes an outDir relative to __dirname (frontend folder)
// With root changed to 'src', outDir in build needs to be relative to that, or absolute.
// The change to path.join(__dirname, '..', outDir) and path.resolve(__dirname, '../public/index.html')
// makes paths relative to the project root (one level up from __dirname which is frontend)
// or correctly points to public/index.html from the project root.

// Corrected createConfig call to simplify output path logic
// The outDir parameter for createConfig should be the final desired path.
// Let's make it simpler: outDir will be relative to the project root.
const correctedCreateConfig = async (finalOutDir: string) => ({
  plugins: [
    (await import('vite-plugin-static-copy')).viteStaticCopy({
      targets: [
        { src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js')), dest: './libs/' },
        { src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx')), dest: './libs/' },
        { src: normalizePath(path.resolve(__dirname, 'node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx')), dest: './libs/' },
        { src: normalizePath(path.resolve(__dirname, 'node_modules/onnxruntime-web/dist/*.wasm')), dest: './libs/' },
      ],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  root: path.resolve(__dirname, 'src'), // Root is frontend/src
  publicDir: path.resolve(__dirname, 'public'), // Public is frontend/public
  base: './',
  server: {
    port: 3000,
    // No proxy needed
  },
  build: {
    outDir: finalOutDir, // This is now an absolute or project-root-relative path
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html'), // Entry HTML is in frontend/public
      },
    },
  },
  ssr: {
    noExternal: ['vite-plugin-static-copy'],
  },
});

export default defineConfig(async ({ mode }) => {
  if (mode === 'web') {
    return correctedCreateConfig(path.resolve(__dirname, 'dist/web'));
  }
  // Default build (e.g. `vite build` without specific mode)
  return correctedCreateConfig(path.resolve(__dirname, 'dist'));
});
