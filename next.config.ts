import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/portal/customers", destination: "/portal/clients", permanent: true },
      { source: "/portal/customers/:id", destination: "/portal/clients/:id", permanent: true },
    ];
  },
};

export default nextConfig;
