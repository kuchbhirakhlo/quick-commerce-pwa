/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                port: "",
                pathname: "/**",
            },
            {
                hostname: "firebasestorage.googleapis.com",
                protocol: "https",
                port: "",
                pathname: "/v0/b/quick-commerce-5f7ad.appspot.com/o/**",
            },
            {
                hostname: "img.freepik.com",
                protocol: "https",
                port: "",
                pathname: "/**",
            },
            {
                hostname: "res.cloudinary.com",
                protocol: "https",
                port: "",
                pathname: "/**",
            },
            {
                hostname: "via.placeholder.com",
                protocol: "https",
                port: "",
                pathname: "/**"
            }

        ],
    },
};

module.exports = nextConfig;