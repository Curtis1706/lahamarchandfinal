/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // TODO: Corriger toutes les erreurs ESLint puis activer
  },
  typescript: {
    ignoreBuildErrors: true, // TODO: Corriger toutes les erreurs TypeScript puis activer
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig