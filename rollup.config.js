import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default commandLineArgs => {
  const isDev = !!commandLineArgs.configDev;
  // 北京时间 (UTC+8) 构建时间戳。
  // Beijing time (UTC+8) build timestamp; helps verify wyyad.js is the latest build.
  const buildTime = new Date(Date.now() + 8 * 3600 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
  return {
    input: "src/response.js",
    output: {
      file: isDev ? "dist/wyyad.dev.js" : "dist/wyyad.js",
      format: "es",
      banner: `// 最新构建时间: ${buildTime} (UTC+8)\n/* 网易云音乐去广告 - Rollup build */`
    },
    plugins: [
      json(),
      nodeResolve({ dedupe: ["@nsnanocat/util"] }),
      commonjs(),
      ...(isDev
        ? []
        : [
            terser({
              format: {
                // 仅保留以"最新构建时间"或"网易云音乐"开头的 banner 注释。
                // Keep only banner comments starting with "最新构建时间" or "网易云音乐".
                comments: (_node, comment) => /最新构建时间|网易云音乐去广告/.test(comment.value)
              }
            })
          ])
    ]
  };
};
