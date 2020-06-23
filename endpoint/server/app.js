const Koa = require('koa');
const app = new Koa();
const {getData}=require('./mongo')

// logger

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});


// response

app.use(async (ctx,next) => {
    const path=ctx.request.path;
    if (path==='/render'){
        const data=await getData('rooms')
        ctx.body=data
    }else {
        ctx.body=404
    }
    await next()
});

app.listen(3333);