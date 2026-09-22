import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin dev resources from external IPs (needed when accessing via public IP or local network)
  allowedDevOrigins: [
    '181.56.10.196',
    '192.168.52.252',
    '192.168.1.*',
    '10.*',
    '172.16.*',
  ],
};

export default nextConfig;
