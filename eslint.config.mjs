import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "drizzle/**", "node_modules/**", "next-env.d.ts", "tsconfig.tsbuildinfo"],
  },
];

export default config;
