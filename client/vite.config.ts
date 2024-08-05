import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import viteTsconfigPaths from "vite-tsconfig-paths";
import remarkGfm from "remark-gfm";
export default defineConfig({
  // depending on your application, base can also be "/"
  base: "",
  plugins: [
    viteTsconfigPaths(),
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  server: {
    // this ensures that the browser opens upon server start
    open: true,
    // this sets a default port to 3000
    port: 3000,
  },
});
