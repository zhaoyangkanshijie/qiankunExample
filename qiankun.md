# qiankun2.6.0源码

## 参考链接

* [万字长文+图文并茂+全面解析 qiankun 源码 - qiankun 篇](https://www.jianshu.com/p/db08174fa4fc)
* [qiankun中的数据通讯方式源码分析](https://juejin.cn/post/6937492575100076039)
* [微前端single-spa原理学习](https://www.cnblogs.com/synY/p/13958963.html)
* [JavaScript读源码系列--微前端之import-html-entry](https://blog.csdn.net/daihaoxin/article/details/106250617)

## 目录

* [qiankun入口start函数](#qiankun入口start函数)
* [注册子应用registerMicroApps](#注册子应用registerMicroApps)
* [加载子应用loader](#加载子应用loader)
    * [沙箱运行环境-独立运行的核心](#沙箱运行环境-独立运行的核心)
        * [LegacySandbox](#LegacySandbox)
        * [ProxySandbox-多实例沙箱](#ProxySandbox-多实例沙箱)
        * [SnapshotSandbox](#SnapshotSandbox)
    * [挂载沙箱](#挂载沙箱)
    * [注册内部生命周期函数](#注册内部生命周期函数)
        * [beforeLoad](#beforeLoad)
        * [mount相关](#mount相关)
        * [unmount相关](#unmount相关)
* [通信](#通信)
* [single-spa](#single-spa)
* [single-spa和qiankun的关系](#single-spa和qiankun的关系)
* [import-html-entry](#import-html-entry)

---

## qiankun入口start函数

index.ts -> api.ts -> export function start(opts: FrameworkConfiguration = {})

start 函数负责初始化一些全局设置，然后启动应用。这些初始化的配置参数有一部分将在 registerMicroApps 注册子应用的回调函数中使用

* 导入配置
* 如果是预渲染，执行相应策略
* 如果配置中包含沙箱，浏览器必须支持window.Proxy
* 启动SingleSpa
* 乾坤状态置为启动状态frameworkStartedDefer.resolve();

## 注册子应用registerMicroApps

index.ts -> api.ts -> export function registerMicroApps(apps,lifeCycles)

* 入参apps属性 name、activeRule、props、entry、render 都是交给 single-spa 使用
* 根据注册应用app的name进行过滤，防止重复注册相同应用
* 调用了 single-spa 的 registerApplication 方法注册了子应用

    registerApplication 方法是 single-spa 中注册子应用的核心函数

    * name（子应用的名称）
    * 回调函数（activeRule 激活时调用）
    * activeRule（子应用的激活规则）
    * props（主应用需要传递给子应用的数据）

    在符合 activeRule 激活规则时将会激活子应用，执行回调函数，返回一些生命周期钩子函数

    * bootstrap
    * mount
    * unmount

## 加载子应用loader

index.ts -> api.ts -> loader.ts -> loadApp

* 使用 import-html-entry 库从 entry 进入加载子应用，加载完成后将返回一个对象

    * template:将脚本文件内容注释后的 html 模板文件
    * assetPublicPath:资源地址根路径，可用于加载子应用资源
    * getExternalScripts:方法：获取外部引入的脚本文件

        该方法的作用就是指定一个 proxy（默认是 window）对象，然后执行该模板文件中所有的 JS，并返回 JS 执行后 proxy 对象的最后一个属性

    * getExternalStyleSheets:方法：获取外部引入的样式表文件
    * execScripts:方法：执行该模板文件中所有的 JS 脚本文件，并且可以指定脚本的作用域 - proxy 对象(如react-main)

* 先对单实例进行检测。在单实例模式下，新的子应用挂载行为会在旧的子应用卸载之后才开始。
* 执行注册子应用时传入的 render 函数，render 函数的内容一般是将 HTML 挂载在指定容器中(getDefaultTplWrapper)

### 沙箱运行环境-独立运行的核心

index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts)

内部的沙箱主要是通过是否支持 window.Proxy 分为 (LegacySandbox,ProxySandbox(多实例)) 和 SnapshotSandbox 三种

#### LegacySandbox

index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> ./sandbox/legacy/sandbox.ts

LegacySandbox 的沙箱隔离是通过:window的全局变量变化，激活沙箱时还原子应用状态，卸载时还原主应用状态（子应用挂载前的全局状态）实现的

* 相关字段
    * addedPropsMapInSandbox:记录沙箱运行期间新增的全局变量
    * modifiedPropsOriginalValueMapInSandbox:记录沙箱运行期间更新的全局变量
    * currentUpdatedPropsValueMap:记录沙箱运行期间操作过的全局变量。上面两个 Map 用于 关闭沙箱 时还原全局状态，而 currentUpdatedPropsValueMap 是在 激活沙箱 时还原沙箱的独立状态
    * name:沙箱名称
    * proxy:代理对象，可以理解为子应用的 global/window 对象
    * sandboxRunning:当前沙箱是否在运行中
    * active:激活沙箱，在子应用挂载时启动
    * inactive:关闭沙箱，在子应用卸载时启动
    * constructor:构造函数，创建沙箱环境

* 构造函数中proxy的get和set(核心)
    * 当调用 set 向子应用 proxy/window 对象设置属性时，所有的属性设置和更新都会先记录在 addedPropsMapInSandbox(新增操作) 或modifiedPropsOriginalValueMapInSandbox(修改操作) 中，然后统一记录到currentUpdatedPropsValueMap(记录操作) 中。
    * 修改全局 window 的属性，完成值的设置。
    * 当调用 get 从子应用 proxy/window 对象取值时，会直接从 window 对象中取值。对于非构造函数的取值将会对 this 指针绑定到 window 对象后，再返回函数。

* 激活active

    在激活沙箱时，沙箱会通过 currentUpdatedPropsValueMap 查询到子应用的独立状态池（沙箱可能会激活多次，这里是沙箱曾经激活期间被修改的全局变量），然后还原子应用状态。

* 关闭inactive

    在关闭沙箱时，通过 addedPropsMapInSandbox 删除在沙箱运行期间新增的全局变量，通过 modifiedPropsOriginalValueMapInSandbox 还原沙箱运行期间被修改的全局变量，从而还原到子应用挂载前的状态。

#### ProxySandbox-多实例沙箱

index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> ./sandbox/proxySandbox.ts

ProxySandbox 是最完备的沙箱模式，完全隔离了对 window 对象的操作，也解决了快照模式中子应用运行期间仍然会对 window 造成污染的问题。

所有子应用对 proxy/window 对象值的存取都受到了控制。设置值只会作用在沙箱内部的 updateValueMap 集合上，取值也是优先取子应用独立状态池（updateValueMap）中的值，没有找到的话，再从 proxy/window 对象中取值。

* 相关字段
    * updateValueMap:记录沙箱中更新的值，也就是每个子应用中独立的状态池
    * name:沙箱名称
    * proxy:代理对象，可以理解为子应用的 global/window 对象
    * sandboxRunning:当前沙箱是否在运行中
    * active:激活沙箱，在子应用挂载时启动
    * inactive:关闭沙箱，在子应用卸载时启动
    * constructor:构造函数，创建沙箱环境

* 构造函数中proxy的get和set(核心)
    * 当调用 set 向子应用 proxy/window 对象设置属性时，所有的属性设置和更新都会命中 updateValueMap，存储在 updateValueMap 集合中，从而避免对 window 对象产生影响
    * 当调用 get 从子应用 proxy/window 对象取值时，会优先从子应用的沙箱状态池 updateValueMap 中取值，如果没有命中才从主应用的 window 对象中取值。对于非构造函数的取值将会对 this 指针绑定到 window 对象后，再返回函数。

#### SnapshotSandbox

index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> ./sandbox/snapshotSandbox.ts

在不支持 window.Proxy 属性时，将会使用 SnapshotSandbox 沙箱

SnapshotSandbox 的沙箱环境主要是通过激活时记录 window 状态快照，在关闭时通过快照还原 window 对象来实现的。

在子应用激活期间，SnapshotSandbox 将会对 window 对象造成污染，属于一个对不支持 Proxy 属性的浏览器的向下兼容方案。

* 相关字段
    * name:沙箱名称
    * proxy:代理对象，此处为 window 对象
    * sandboxRunning:当前沙箱是否激活
    * windowSnapshot:window 状态快照
    * modifyPropsMap:沙箱运行期间被修改过的 window 属性
    * constructor:构造函数，激活沙箱
    * active:激活沙箱，在子应用挂载时启动
    * inactive:关闭沙箱，在子应用卸载时启动

* 激活active

    在沙箱激活时，会先给当前 window 对象打一个快照，记录沙箱激活前的状态。打完快照后，函数内部将 window 状态通过 modifyPropsMap 记录还原到上次的沙箱运行环境，也就是还原沙箱激活期间（历史记录）修改过的 window 属性。

* 关闭inactive

    在沙箱关闭前通过遍历比较每一个属性，将被改变的 window 对象属性值记录在 modifyPropsMap 集合中。在记录了 modifyPropsMap 后，将 window 对象通过快照 windowSnapshot 还原到被沙箱激活前的状态，相当于是将子应用运行期间对 window 造成的污染全部清除。

### 挂载沙箱

index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts)

* createSandboxContainer返回了一个 sandbox 沙箱，还返回了一个 mount 和 unmount 方法，分别在子应用挂载时和卸载时的时候调用。

    * mount

        index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> mount(./sandbox/index.ts)

        * 激活子应用沙箱
        * 在沙箱启动后开始劫持各类全局监听patchAtMounting

            index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> mount(./sandbox/index.ts) -> patchAtMounting(./sandbox/patchers/index.ts)

            * 引入4个函数

                * interval.ts（计时器劫持）

                    将 setInterval 进行重载，将每个启用的定时器的 intervalId 都收集起来，以便在子应用卸载时调用 free 函数将计时器全部清除

                    在进入子应用时，setInterval 已经被替换成了劫持后的函数，防止全局计时器泄露污染。

                * windowListener.ts（window 事件监听劫持）
                * historyListener.ts（window.history 事件监听劫持）
                * dynamicAppend文件夹（动态添加样式表和脚本文件劫持）

                    * style
                    
                        如果当前子应用处于激活状态（判断子应用的激活状态主要是因为：当主应用切换路由时可能会自动添加动态样式表，此时需要避免主应用的样式表被添加到子应用head节点中导致出错），那么动态 style 样式表就会被添加到子应用容器内，在子应用卸载时样式表也可以和子应用一起被卸载，从而避免样式污染。

                    * script

                        主要目的就是为了将动态脚本运行时的 window 对象替换成 proxy 代理对象，使子应用动态添加的脚本文件的运行上下文也替换成子应用自身。

                        对外部引入的 script 脚本文件使用 fetch 获取，然后使用 execScripts 指定 proxy 对象（作为 window 对象）后执行脚本文件内容，同时也触发了 load 和 error 两个事件。

                        将注释后的脚本文件内容以注释的形式添加到子应用容器内。

                        执行内嵌脚本文件。

        * 重建副作用

            index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> mount(./sandbox/index.ts) -> rebuild(./sandbox/patchers/dynamicAppend/common.ts)

            这里缓存了一份 cssRules，在重新挂载的时候会执行 rebuild 函数将其还原。这是因为样式元素 DOM 从文档中删除后，浏览器会自动清除样式元素表。如果不这么做的话，在重新挂载时会出现存在 style 标签，但是没有渲染样式的问题。

    * unmount

        index.ts -> api.ts -> loader.ts -> loadApp -> createSandboxContainer(./sandbox/index.ts) -> unmount(./sandbox/index.ts)

        在 patchAtMounting 函数中劫持了各类全局监听，并返回了解除劫持的 free 函数。在卸载应用时调用 free 函数解除这些全局监听的劫持行为

### 注册内部生命周期函数

index.ts -> api.ts -> loader.ts -> loadApp

* 注册全子应用共享生命周期

    * beforeUnmount
    * afterUnmount
    * afterMount
    * beforeMount
    * beforeLoad

* 引入框架声明周期，并设置__POWERED_BY_QIANKUN__(loader.ts -> ./addons/index.ts -> ./addons/engineFlag.ts)

    * global默认为window
    * beforeLoad/beforeMount均设置__POWERED_BY_QIANKUN__为true
    * beforeUnmount删除__POWERED_BY_QIANKUN__属性

#### beforeLoad

* 在注册完了生命周期函数后，立即触发了 beforeLoad 生命周期钩子函数

* 指定了脚本文件的运行沙箱，执行完子应用的脚本文件后，返回了一个对象，对象包含了子应用的生命周期:bootstrap/mount/unmount

*  对子应用的生命周期钩子函数做了个检测，如果在子应用的导出对象中没有发现生命周期钩子函数，会在沙箱对象中继续查找生命周期钩子函数。如果最后没有找到生命周期钩子函数则会抛出一个错误，所以我们的子应用一定要有 bootstrap, mount, unmount 这三个生命周期钩子函数才能被 qiankun 正确嵌入到主应用中。

#### mount相关

* 在 bootstrap 阶段调用了子应用暴露的 bootstrap 生命周期函数

* 对单实例模式进行检测。在单实例模式下，新的子应用挂载行为会在旧的子应用卸载之后才开始。

* 执行注册子应用时传入的 render 函数，将 HTML Template 和 loading 作为入参。这里一般是在发生了一次 unmount 后，再次进行 mount 挂载行为时将 HTML 挂载在指定容器中(需对重复挂载的情况进行判断)

* 触发了 beforeMount 全局生命周期钩子函数

* 激活了对应的子应用沙箱，劫持了部分全局监听。此时开始子应用的代码将在沙箱中运行。

* 触发子应用的 mount 生命周期钩子函数，在这一步通常是执行对应的子应用的挂载操作，如 ReactDOM.render、Vue.$mount

* 再次调用 render 函数，此时 loading 参数为 false，代表子应用已经加载完成。

* 触发了 afterMount 全局生命周期钩子函数

* 在单实例模式下设置 prevAppUnmountedDeferred 的值，这个值是一个 promise，在当前子应用卸载时才会被 resolve，在该子应用运行期间会阻塞其他子应用的挂载动作

#### unmount相关

* 在子应用激活阶段， activeRule 未命中时将会触发 unmount 卸载行为

* 触发了 beforeUnmount 全局生命周期钩子函数

* 先执行了子应用的 unmount 生命周期钩子函数，保证子应用仍然是运行在沙箱内，避免造成状态污染。

* 卸载沙箱，关闭了沙箱的激活状态。

* 触发了 afterUnmount 全局生命周期钩子函数

* 触发 render 方法，并且传入的 appContent 为空字符串，此处可以清空主应用容器内的内容。

* 当前子应用卸载完成后，在单实例模式下触发 prevAppUnmountedDeferred.resolve()，使其他子应用的挂载行为得以继续进行，不再阻塞。

## 通信

index.ts -> globalState.ts

定义全局状态，并返回通信方法，在主应用使用，mount生命周期props传递给 single-spa，微应用通过 props 获取通信方法。

* initGlobalState

    初始化 globalState 初始化是一个空的对象

    deps 初始化是一个空的对象 用来存放订阅器

    把初始化对象(state) 传给 initGlobalState，使用lodash 深克隆参数，根据时间戳新建一个唯一id的action

* onGlobalStateChange

    两个参数一个是callback回调函数 一个是fireImmediately 是否直接执行回调函数

    把订阅器存放在 deps上 如果有新的订阅器 id相同的话，订阅器将会被覆盖

* setGlobalState

    对于state 会做第一层的校验 只有是初始化的有的属性才允许被修改

    符合条件的推入到changeKeys，并且修改 _globalState ，判断 changeKeys 的长度如果长度大于1，触发 emitGlobal(globalState, prevGlobalState); 并且返回修改成功true

    emitGlobal 我们根据传过来的state 和preState 我把订阅器一个个触发

* offGlobalStateChange

    卸载订阅器的钩子

## single-spa

* registerApplication(应用注册)

    sanitizeArguments规范化属性，有错误的就抛出异常。把我们的传入的参数整理完了之后的属性值重新赋值给registration，并且返回出去。

    检查注册的子应用信息是否有重名的现象,有的话就抛出异常，没有的话就把这个registration和一个对象进行合并，推入一个apps的数组里面，对子应用的信息进行缓存。

    对象中有一个status的属性，后面会被多次使用。

    registration.loadApp属性存放注册选项的加载函数，决定了加载子应用的代码的方式。

* reroute(负责改变app.status和执行在子应用中注册的生命周期函数)

    getAppChanges定义4个状态：appsToUnload、appsToUnmount、appsToLoad、appsToMount

    apps是在registerApplication方法中注册的子应用的信息的json对象，缓存子应用的配置信息

    遍历apps时会根据当前的url进行判断需要激活哪一个子应用

    在执行registerApplication前面，把app.status设置为了NOT_LOADED

    activeWhen返回true or false表明你当前的url是否匹配到了子应用

    appsToLoad是通过activeWhen规则分析当前用户所在url，得到需要加载的子应用的数组

    在start之前生命周期函数都已经准备就绪，但是不会被触发。直到start才会开始触发

    loadApp是传入registerApplication的加载函数

    * 加载函数的自定义可以看出:为什么single-spa这个可以支持不同的前端框架例如vue，react接入?
    
        原因在于前端框架最终打包都会变成app.js, vendor-chunk.js等js文件，变回原生的操作。微前端的主应用去引入这些

        js文件渲染子应用，本质上都是转为原生dom操作，所以加载函数就是single-spa对应子应用资源引入的入口地方。

    * 加载函数中要返回出子应用中导出的生命周期函数提供给主应用

        bootstrap, mount, unmount, unload等等的生命周期

* validLifecycleFn(获取生命周期)

    **主应用和子应用环境是有区别的，通过主应用去获取到子应用的生命周期函数，需要一个共同的地方--window**

    **因此在子应用vue的入口文件main.js定义生命周期函数，但造成了全局环境的污染**

    **要想避免这个污染，在qiankun框架中，通过了一个沙箱环境对主应用和子应用之间的环境进行了隔离**

    single-spa-vue的工具也能够解决这个问题

    无论怎么写，只需要注意一个条件，拿到的生命周期的必须用对象存放起来。

* performAppChanges(调用生命周期)

    reroute后的start，调用生命周期

    appsToLoad缓存了在reroute开头通过getAppChange，然后根据activeWhen的规则匹配到需要加载的子应用
    
    app.loadApp加载函数,得到的生命周期函数会挂载到app配置对象

    如果检查到了应用处于需要启动状态，那么就改变应用状态变为BOOTSTRAPING，真正调用生命周期函数bootstrap

* navigation-events(路由控制)

    增加了两个监听:hashchange/popstate

    利用装饰器，对pushState/replaceState增加功能，用户在执行这个pushState/replaceState方法的时候也能够重新reroute

    pushState执行reroute的手段本质上就是通过触发popstate事件

## single-spa和qiankun的关系

在single-spa中，通过reroute和路由控制不断调度子应用，加载子应用的代码，切换子应用，改变子应用的app.status。解决了子应用之间的调度问题。

但是single-spa的registerApplication加载函数需要用户去实现，告诉single-spa，需要如何去加载子应用的代码，同时让主应用获取到子应用的生命周期函数。

qiankun提供了完成上述部分的代码

qiankun的编写是基于single-spa和import-html-entry两个库，single-spa帮住qiankun如何调度子应用，import-html-entry提供了一种window.fetch方案去加载子应用的代码。

## import-html-entry

qiankun一大特点就是将html做为入口文件，规避了JavaScript为了支持缓存而根据文件内容动态生成文件名，造成入口文件无法锁定的问题。

import-html-entry主要做了：

1. 解析template，被处理后的html模板字符串，外联的样式文件被替换为内联样式
2. 资源路径解析
3. 将模板中所有script标签按照出现的先后顺序，提取出内容，组成一个数组
4. 将模板中所有link和style标签按照出现的先后顺序，提取出内容，组成一个数组
5. 执行所有的script中的代码，并返回为html模板入口脚本链接entry指向的模块导出对象。

