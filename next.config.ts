import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async redirects() {
    return [
      {
        source: '/register/admission/admin',
        destination: '/admin/admissions',
        permanent: false,
      },
      {
        source: '/register/admission/admin/:path*',
        destination: '/admin/admissions',
        permanent: false,
      },
      {
        source: '/register/admissions/admin',
        destination: '/admin/admissions',
        permanent: false,
      },
      {
        source: '/admission/admin',
        destination: '/admin/admissions',
        permanent: false,
      },
      {
        source: '/admissions/admin',
        destination: '/admin/admissions',
        permanent: false,
      },
      {
        source: '/register/belt-exam/admin',
        destination: '/admin/exams',
        permanent: false,
      },
      {
        source: '/register/competition/admin',
        destination: '/admin/competitions',
        permanent: false,
      },
      {
        source: '/register/seminar/admin',
        destination: '/admin/seminars',
        permanent: false,
      },
      {
        source: '/register/admin',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
