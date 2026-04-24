import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

export default commandLineArgs => {
  const isDev = !!commandLineArgs.configDev;
  return {
    input: "src/response.js",
    output: {
      file: isDev ? "dist/wyyad.dev.js" : "dist/wyyad.js",
      format: "es",
      banner: "/* 网易云音乐去广告 - Rollup build */"
    },
    plugins: [
      json(),
      nodeResolve({ dedupe: ["@nsnanocat/util"] }),
      commonjs(),
      ...(isDev ? [] : [terser()])
    ]
  };
};
