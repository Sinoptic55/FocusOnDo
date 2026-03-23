import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
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
