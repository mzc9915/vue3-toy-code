import minimist from "minimist";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module";
import esbuild from "esbuild";

// [
//     '/Users/mzc/.nvm/versions/node/v20.13.1/bin/node',
//     '/Users/mzc/Desktop/vue3-toy-code/scripts/dev.js',
//     'compiler-core',
//     '-f',
//     'esm'
// ]
// console.log(process.argv, args);

const args = minimist(process.argv.slice(2))

console.log(args._);

const __filename = fileURLToPath(import.meta.url);  // 获取文件绝对路径 file
const __dirname = dirname(__filename);  // 获取文件所在文件夹绝对路径 dir

console.log(__filename, __dirname);

const require = createRequire(import.meta.url);  // 获取 require 函数
const target = args._[0] || 'reactivity' ;  // 获取第一个参数
const format = args.f || 'iife'  // 获取 format 参数

const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);  // 获取入口文件
const pkg = require(`../packages/${target}/package.json`);  // 获取 package.json


esbuild.context({
    entryPoints: [entry],
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true,
    platform: 'browser',
    sourcemap: true,
    format,
    globalName: pkg.buildOptions?.name
}).then((ctx)=>{
    return ctx.watch()
})