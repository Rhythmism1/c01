/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*' // Adjust this URL to match your FastAPI server
      }
    ]
  }
}

module.exports = nextConfig
