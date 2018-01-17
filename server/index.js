import Koa from 'koa'
import path from 'path'
import fs from 'fs'
import serve from 'koa-static'
import favicon from 'koa-favicon'
import {createBundleRenderer} from 'vue-server-renderer'
import setupVueDevSsr from './vue-dev-ssr'

const app = new Koa()
export default app

const isProduction = process.env.NODE_ENV ==='production'

/** Server Side Rendering **/
const templatePath = path.resolve(__dirname,'../templates/index.template.html')

let renderer

/**
 * Create bundle renderer. Serves bundled files for production.
 * Observes and updates bundle, manifest and template in dev mode.
 * @private
 */
function _createRenderer({template,bundle,manifest}={}){
    const viewTemplate = template || fs.readFileSync(templatePath,'utf-8')
    const serverBundle = bundle || require('./../build/vue-ssr-server-bundle.json')
    const clientManifest = manifest || require('./../build/vue-ssr-client-manifest.json')
    return createBundleRenderer(serverBundle,{runInNewContext:false,template:viewTemplate,clientManifest})
}

if(isProduction) {
    renderer = _createRenderer()
    // Serve static files [comment for nginx]
    app.use(favicon(path.resolve(__dirname,'../favicon.ico')))
    app.use(serve(path.resolve(__dirname,'./build'),{ maxage: 1000 * 60 * 15, gzip: true}))
}else {
    renderer = _createRenderer()
    setupVueDevSsr(templatePath).on('update',(payload)=>renderer = _createRenderer(payload))
}

/** Routing **/

const Router = require("koa-router");
const router = new Router();

router.get("*", async ctx => {
     const context = { url: ctx.req.url}
     ctx.body = await renderer.renderToString(context)
});

app.use(router.routes())






