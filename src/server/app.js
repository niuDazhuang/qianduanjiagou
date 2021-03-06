const Koa             = require('koa')
const log4js          = require('log4js')
const staticServer    = require('koa-static')
const render          = require('koa-swig')
const co              = require('co')
const awilix          = require('awilix')
const awilixKoa       = require('awilix-koa')

const errorHandler    = require('./middlewares/error.handler')
const config          = require('./config')

const { createContainer, Lifetime } = awilix
const { loadControllers, scopePerRequest } = awilixKoa
const { PORT, VIEW_DIR, STATIC_DIR } = config
const app = new Koa()

// IOC容器
const container = createContainer()
// 每一次请求new
app.use(scopePerRequest(container))
// 装载所有的service到controller 利用切面注入
container.loadModules([__dirname+'/services/*.js'], {
  formatName: 'camelCase',
  resolverOptions: {
    lifetime: Lifetime.SCOPED
  }
})

// 模板
app.context.render = co.wrap(render({
  root: VIEW_DIR,
  autoescape: true,
  cache: 'memory',
  ext: 'html',
  varControls: ['[[', ']]'],
  writeBody: false
}))

// 错误日志
log4js.configure({
  appenders: { cheese: { type: 'file', filename: `${__dirname}/logs/cheese.log` } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
})
errorHandler.error(app, log4js.getLogger('cheese'))


// 控制器
app.use(loadControllers('./controllers/*.js', { cwd: __dirname }))


// 静态资源
app.use(staticServer(STATIC_DIR))


// 启动
app.listen(PORT, () => {
  console.log(`server is open on: http://localhost:${PORT}`)
})
