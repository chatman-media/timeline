import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Конфигурация для Webpack (используется в режиме production)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      },
    })
    return config
  },
  // Конфигурация для Turbopack (используется в режиме development)
  turbopack: {
    rules: {
      // Добавляем правила для Turbopack
      ".worker.ts": ["worker-loader"],
    },
  },
  // Отключаем сжатие для поддержки WebSocket
  compress: false,
  // Увеличиваем таймаут для поддержки длительных соединений
  poweredByHeader: false,
  // Настройки для поддержки WebSocket
  serverRuntimeConfig: {
    socketServer: true,
  },
}

export default nextConfig
