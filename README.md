# qiankunExample

## 参考链接

* [qiankun中文文档](https://qiankun.umijs.org/zh/faq)
* [qiankun源码与umi基座样例](https://github.com/umijs/qiankun)
* [qiankun教程](https://www.jianshu.com/p/a5d9c53abde3)
* [基于 qiankun 的微前端最佳实践（图文并茂） - 应用间通信篇](https://blog.csdn.net/qq_34621851/article/details/106003110)
* [qiankun通信样例代码](https://github.com/a1029563229/micro-front-template/tree/feature-communication)
* [Vue+微前端(QianKun)落地实施和最后部署上线总结（二）普通版](https://juejin.cn/post/7041151571467436063)
* [qiankun-微应用生命周期钩子](https://blog.csdn.net/weixin_44123848/article/details/118679042)

## 目录

* [vue3基座样例](vue3基座样例)
* [应用通讯](#应用通讯)
    * [Actions通信](#Actions通信)
    * [Shared通信](#Shared通信)
* [部署](#部署)
    * [双端口部署](#双端口部署)
    * [单端口部署](#单端口部署)

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
    3. 由于状态池无法跟踪，通信场景较多时，容易出现状态混乱、维护困难等问题。

* 使用

    1. 主应用

    /src/shared/actions.js初始化全局状态
    ```js
    import { initGlobalState } from "qiankun";
    const initialState = {};
    const actions = initGlobalState(initialState);
    export default actions;
    ```

    以App.vue页面为例，点击登录按钮修改全局token并监听变化
    ```html
    <button @click="login()">登录</button>
    <script>
    import { onMounted } from 'vue';
    import actions from "./shared/actions";
    export default {
        name: 'App',
        setup() {
            const login = () => {
                actions.setGlobalState({ 
                    token: 'mainLoginToken'  
                });
            }

            onMounted(() => {
                // 注册一个观察者函数
                actions.onGlobalStateChange((state, prevState) => {
                    // state: 变更后的状态; prevState: 变更前的状态
                    console.log("主应用观察者：token 改变前的值为 ", prevState.token);
                    console.log("主应用观察者：登录状态发生改变，改变后的 token 的值为 ", state.token);
                });
            });

            return {
                login
            }
        }
    }
    </script>
    ```

    2. 子应用

    /src/shared/actions.js用于承载父应用传过来的onGlobalStateChange和setGlobalState
    ```js
    function emptyAction() {
        // 警告：提示当前使用的是空 Action
        console.warn("Current execute action is empty!");
    }

    class Actions {
        // 默认值为空 Action
        actions = {
            onGlobalStateChange: emptyAction,
            setGlobalState: emptyAction
        };

        /**
        * 设置 actions
        */
        setActions(actions) {
            this.actions = actions;
        }

        /**
        * 映射
        */
        onGlobalStateChange(...args) {
            return this.actions.onGlobalStateChange(...args);
        }

        /**
        * 映射
        */
        setGlobalState(...args) {
            return this.actions.setGlobalState(...args);
        }
    }

    const actions = new Actions();
    export default actions;
    ```

    main.js在render时传入props
    ```js
    function render(props = {}) {
        if (props) {
            // 注入 actions 实例
            actions.setActions(props);
        }
        ...
    }
    ```

    以App.vue页面为例，获取token
    ```html
    <script>
    import { onMounted } from "vue";
    import { useRoute, useRouter } from "vue-router";
    import actions from "@/shared/actions";
    export default {
    name: "App",
    setup() {
        const route = useRoute();
        const router = useRouter();

        onMounted(() => {
            actions.onGlobalStateChange((state) => {
                const { token } = state;
                console.log("登录信息", token);
                console.log("vue-router", route, router);
                //router.push("/about");
            }, true);
        });

        return {};
    },
    };
    </script>
    ```

* 注意

    * 父子应用对同一全局变量进行setGlobalState和onGlobalStateChange导致循环调用

        1. 可加入if判断，防止两边循环赋值
        2. 可只在父应用setGlobalState，子应用onGlobalStateChange
        3. 父子应用使用不同变量

    * 示例示范了父应用设置，子应用监听，反之亦然

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

* 为什么shared通信需要redux而不能是vuex?

    redux和vuex都是状态管理器，vuex吸取了redux的优点又舍弃了部分特性，导致vuex只适配于vue，action和mutation取代了reducer，因此使用redux能够适用于所有框架。

* 使用

    1. 主应用

    /src/shared/store.js创建redux
    ```js
    import { createStore } from "redux";

    const reducer = (state = {}, action) => {
        switch (action.type) {
            default:
                return state;
            // 设置 Token
            case "SET_TOKEN":
                return {
                    ...state,
                    token: action.payload,
                };
        }
    };

    const store = createStore(reducer);

    export default store;
    ```

    /src/shared/index.js定义共享对象，调用redux方法
    ```js
    import store from "./store";

    class Shared {
        /**
        * 获取 Token
        */
        getToken() {
            const state = store.getState();
            return state.token || "";
        }

        /**
        * 设置 Token
        */
        setToken(token) {
            // 将 token 的值记录在 store 中
            store.dispatch({
                type: "SET_TOKEN",
                payload: token
            });
        }
    }

    const shared = new Shared();
    export default shared;
    ```

    /src/views/About.vue调用实例的set
    ```js
    import { onMounted } from "vue";
    import shared from "../shared/index";
    export default {
        name: "About",
        setup() {
            const login = () => {
                shared.setToken("reduxToken");
            };

            return {
                login
            };
        },
    };
    ```

    main.js传递props
    ```js
    {
        name: 'vue3',
        entry: '//localhost:7105',
        container: '#subapp-viewport',
        activeRule: '/vue3',
        // 通过 props 将 shared 传递给子应用
        props: { shared }
    },
    {
        name: 'purehtml',
        entry: '//localhost:7104',
        container: '#subapp-viewport',
        activeRule: '/purehtml',
        // 通过 props 将 shared 传递给子应用
        props: { shared }
    }
    ```

    2. 子应用

    /src/shared/index.js子应用共享类，承载父应用实例或使用自身方法
    ```js
    class Shared {
        /**
        * 获取 Token
        */
        getToken() {
            // 子应用独立运行时，在 localStorage 中获取 token
            return localStorage.getItem("token") || "";
        }

        /**
        * 设置 Token
        */
        setToken(token) {
            // 子应用独立运行时，在 localStorage 中设置 token
            localStorage.setItem("token", token);
        }
    }

    class SharedModule {
        static shared = new Shared();

        /**
        * 重载 shared
        */
        static overloadShared(shared) {
            SharedModule.shared = shared;
        }

        /**
        * 获取 shared 实例
        */
        static getShared() {
            return SharedModule.shared;
        }
    }

    export default SharedModule;
    ```

    main.js在render时重载父应用方法,如props无传过来的方法，则使用自身方法
    ```js
    function render(props = {}) {
        // 当传入的 shared 为空时，使用子应用自身的 shared
        // 当传入的 shared 不为空时，主应用传入的 shared 将会重载子应用的 shared
        const { shared = SharedModule.getShared() } = props;
        SharedModule.overloadShared(shared);
        ...
    }
    ```

    以/src/views/About.vue为例get
    ```js
    import { onMounted } from "vue";
    import SharedModule from "../shared/index";
    export default {
        name: "About",
        setup() {
            let shared;
            
            onMounted(() => {
                shared = SharedModule.getShared();
                // 使用 shared 获取 token
                const token = shared.getToken();
                console.log('receive redux token',token);
            });

            const changeToken = () => {
                shared.setToken('redux vue3 token');
            }

            return {
                changeToken
            }
        },
    };
    ```

* 注意

    * 示例示范了父应用set，传递props，子应用get，反之，子应用与父应用通过props共享实例后，子应用set，父应用get即可


## 部署

需要对主应用和子应用分别build

### 双端口部署

端口A部署主应用，端口B部署所有子应用且设置支持cors。

* 缺点：需要两个端口
* 优点：解决页面刷新直接跳到子应用

```conf
# 主应用 9001
{
  listen 9001;

  location / {
    root /data/front-end/front-micro/micro_main;
    index index.html;

    try_files $uri $uri/ /index.html;

    expires -1;
    add_header Cache-Control no-cache;
  }
}

# 所有子应用 9002
{
  listen 9002;

  # cors
  add_header 'Access-Control-Allow-Origin' "$http_origin";
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
  add_header 'Access-Control-Allow-Headers' 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type    ';
  add_header 'Access-Control-Allow-Credentials' 'true';
    
  # 子应用A
  location /module/micro_A {
    index index.html;
    try_files $uri $uri/ /micro_A/index.html;
    alias /data/front-end/front-micro/micro_A;

    expires -1;
    add_header Cache-Control no-cache;
  }

  # 子应用B
  location /module/micro_B {
    index index.html;
    try_files $uri $uri/ /micro_B/index.html;
    alias /data/front-end/front-micro/micro_B;

    expires -1;
    add_header Cache-Control no-cache;
  }

  # 子应用C
  location /module/micro_C {
    index index.html;
    try_files $uri $uri/ /micro_C/index.html;
    alias /data/front-end/front-micro/micro_C;

    expires -1;
    add_header Cache-Control no-cache;
  }
}
```

### 单端口部署

所有应用都部署在一个端口上，不会存在跨域

* 优点：只需管理一个端口
* 缺点：页面刷新直接跳到子应用

```conf
{
  listen 9001;
    
  # 主应用
  location / {
    root /data/front-end/front-micro/micro_main;
    index index.html;

    try_files $uri $uri/ /index.html;

    expires -1;
    add_header Cache-Control no-cache;
  }

  # 子应用A
  location /module/micro_A {
    index index.html;
    try_files $uri $uri/ /micro_A/index.html;
    alias /data/front-end/front-micro/micro_A;

    expires -1;
    add_header Cache-Control no-cache;
  }

  # 子应用B
  location /module/micro_B {
    index index.html;
    try_files $uri $uri/ /micro_B/index.html;
    alias /data/front-end/front-micro/micro_B;

    expires -1;
    add_header Cache-Control no-cache;
  }

  # 子应用C
  location /module/micro_C {
    index index.html;
    try_files $uri $uri/ /micro_C/index.html;
    alias /data/front-end/front-micro/micro_C;

    expires -1;
    add_header Cache-Control no-cache;
  }
}
```