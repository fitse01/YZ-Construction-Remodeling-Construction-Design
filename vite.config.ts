// Silence the deprecated vite-tsconfig-paths warning printed during config loading
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('vite-tsconfig-paths')) {
    return;
  }
  originalWarn(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('vite-tsconfig-paths')) {
    return;
  }
  originalLog(...args);
};

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const rawConfig = defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force Node.js preset
  nitro: {
    preset: "node-server",
  },
  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  },
});

// Intercept and remove the deprecated vite-tsconfig-paths plugin if registered
const config = typeof rawConfig === 'function'
  ? async (...args: any[]) => {
      const resolved = await (rawConfig as any)(...args);
      if (resolved && resolved.plugins) {
        resolved.plugins = resolved.plugins.filter((plugin: any) => {
          return !plugin || (plugin.name !== 'vite:tsconfig-paths' && plugin.name !== 'tsconfig-paths');
        });
      }
      return resolved;
    }
  : (() => {
      const resolved = rawConfig as any;
      if (resolved && resolved.plugins) {
        resolved.plugins = resolved.plugins.filter((plugin: any) => {
          return !plugin || (plugin.name !== 'vite:tsconfig-paths' && plugin.name !== 'tsconfig-paths');
        });
      }
      return resolved;
    })();

export default config;
