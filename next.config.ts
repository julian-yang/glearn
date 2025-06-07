import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Required for static export
  output: 'export', 

  // Optional: trailingSlash will create index.html inside a directory for each page (e.g. /about -> /about/index.html)
  // trailingSlash: true, 

  // Configure base path and asset prefix for GitHub Pages subdirectory hosting
  basePath: isProd ? '/glearn' : '', // Replace 'your-repo-name' with your actual GitHub repository name
  assetPrefix: isProd ? '/glearn/' : '', // Replace 'your-repo-name' with your actual GitHub repository name

  // Important for static exports: disable Next.js Image Optimization as it requires a server
  images: {
    unoptimized: true, 
  },

  // If you are using the App Router and have dynamic routes,
  // you might need to specify `generateStaticParams` for those routes.
  // App Router specific settings (if applicable, remove if using Pages Router exclusively):
  // experimental: {
  //   appDir: true, // Only if you are using the App Router
  // },
};

export default nextConfig;
