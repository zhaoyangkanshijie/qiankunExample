# qiankunExample

## 参考链接

* [qiankun中文文档](https://qiankun.umijs.org/zh/faq)
* [qiankun源码与umi基座样例](https://github.com/umijs/qiankun)
* [qiankun教程](https://www.jianshu.com/p/a5d9c53abde3)
* [基于 qiankun 的微前端最佳实践（图文并茂） - 应用间通信篇](https://cloud.tencent.com/developer/article/1770605)

## 目录

* [vue3基座样例](vue3基座样例)
* [应用通讯](#应用通讯)
* [生命周期使用](#生命周期使用)
* [部署](#部署)

---

## vue3基座样例

把官方vue3子应用样例复制一份作为基座

基座main.js的qiankun部分同umi样例，修改注册微应用部分和默认进入的子应用

vue3子应用及其它子应用(含mount/unmount/bootstrap/打包配置)与官方样例完全一致

基座进入子应用页面需使用pushState，而不是router-link，参考基座App.vue

根目录package.json保留cross-env用作purehtml运行和npm-run-all并发运行所有应用

如有缺包，可执行加入package.json

如有报错，见[参考链接](#参考链接)1

## 应用通讯

基座main.js
```js
//初始化后获得监听和设置函数
const { onGlobalStateChange, setGlobalState } = initGlobalState({
    user: 'qiankun',
});

//监听值变化，被设置后触发
onGlobalStateChange((value, prev) => console.log('[onGlobalStateChange - master]:', value, prev));

//设置值
setGlobalState({
    ignore: 'master',
    user: {
        name: 'master',
    },
});
```






## 生命周期使用


## 部署



