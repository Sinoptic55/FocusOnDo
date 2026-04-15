import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/app.ts'],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'esm',
  sourcemap: true,
  minify: !isWatch,
  target: 'es2020',
  loader: {
    '.ts': 'ts'
  },
  define: {
    'import.meta.env': JSON.stringify({
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000'
    })
  }
};

// Initial copy of static files
const distDir = 'dist';
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}
copyFileSync('index.html', join(distDir, 'index.html'));
copyFileSync('styles.css', join(distDir, 'styles.css'));

// Copy sounds directory if it exists
const soundsDir = 'sounds';
const distSoundsDir = join(distDir, 'sounds');
if (existsSync(soundsDir)) {
  if (!existsSync(distSoundsDir)) {
    mkdirSync(distSoundsDir, { recursive: true });
  }
  cpSync(soundsDir, distSoundsDir, { recursive: true });
  console.log('Copied sounds directory to dist/sounds');
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  
  const { host, port } = await ctx.serve({
    servedir: 'dist',
    port: 5173,
    fallback: 'dist/index.html'
  });

  console.log(`Server started at http://${host}:${port}`);
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete!');
}
