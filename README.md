# qiankunExample

## 参考链接

* [qiankun中文文档](https://qiankun.umijs.org/zh/faq)
* [qiankun源码与umi基座样例](https://github.com/umijs/qiankun)
* [qiankun教程](https://www.jianshu.com/p/a5d9c53abde3)
* [基于 qiankun 的微前端最佳实践（图文并茂） - 应用间通信篇](https://cloud.tencent.com/developer/article/1770605)
* [qiankun通信样例代码](https://github.com/a1029563229/micro-front-template/tree/feature-communication)

## 目录

* [vue3基座样例](vue3基座样例)
* [应用通讯](#应用通讯)
    * [Actions通信](#Actions通信)
    * [Shared通信](#Shared通信)
* [生命周期使用](#生命周期使用)
* [部署](#部署)

---

## vue3基座样例

把官方vue3子应用样例复制一份作为基座

基座main.js的qiankun部分同umi样例，修改注册微应用部分和默认进入的子应用

vue3子应用及其它子应用(含mount/unmount/bootstrap/打包配置)与官方样例完全一致

配好router和store
```js
import { createRouter, createWebHistory } from 'vue-router';
import routes from './router';
import store from './store';

let app = createApp(App);
let history = createWebHistory('/');
let router = createRouter({
    history,
    routes,
});
app.use(router);
app.use(store);
app.mount('#app');
```

根目录package.json保留cross-env用作purehtml运行和npm-run-all并发运行所有应用

如有缺包，可执行加入package.json

如有报错，见[参考链接](#参考链接)1

## 应用通讯

### Actions通信

* 通信原理

    qiankun 内部提供了 initGlobalState 方法用于注册 MicroAppStateActions 实例用于通信，该实例有三个方法，分别是：

    1. setGlobalState：设置 globalState - 设置新的值时，内部将执行 浅检查，如果检查到 globalState 发生改变则触发通知，通知到所有的 观察者 函数。
    2. onGlobalStateChange：注册 观察者 函数 - 响应 globalState 变化，在 globalState 发生改变时触发该 观察者 函数。
    3. offGlobalStateChange：取消 观察者 函数 - 该实例不再响应 globalState 变化。

* 优点

    1. 使用简单
    2. 官方支持性高
    3. 适合通信较少的业务场景

* 缺点

    1. 子应用独立运行时，需要额外配置无 Actions 时的逻辑；
    2. 子应用需要先了解状态池的细节，再进行通信；
    3. 由于状态池无法跟踪，通信场景较多时，容易出现状态混乱、维护困难等问题；

### Shared通信

* 通信原理

    主应用基于 redux 维护一个状态池，通过 shared 实例暴露一些方法给子应用使用。同时，子应用需要单独维护一份 shared 实例，在独立运行时使用自身的 shared 实例，在嵌入主应用时使用主应用的 shared 实例，这样就可以保证在使用和表现上的一致性。

* 优点

    1. 可以使用市面上比较成熟的状态管理工具，如 redux、mobx，可以有更好的状态管理追踪和一些工具集。
    2. 可以帮助主应用更好的管控子应用。子应用只可以通过 shared 实例来操作状态池，可以避免子应用对状态池随意操作引发的一系列问题。
    3. 适合通信较少的业务场景

* 缺点

    1. 通信方案需要自行维护状态池，这样会增加项目的复杂度。
    2. 通信方案要求父子应用都各自维护一份属于自己的 shared 实例，同样会增加项目的复杂度。
    3. 子应用可以完全独立于父应用运行（不依赖状态池），子应用也能以最小的改动被嵌入到其他 第三方应用 中。
    

## 生命周期使用


## 部署



