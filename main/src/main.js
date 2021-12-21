import { createApp } from 'vue'
import App from './App.vue'
import { registerMicroApps, runAfterFirstMounted, setDefaultMountApp, start } from 'qiankun';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './router';
import store from './store';
import shared from './shared/index'

let app = createApp(App);
let history = createWebHistory('/');
let router = createRouter({
    history,
    routes,
});
app.use(router);
app.use(store);
app.mount('#app');

registerMicroApps(
    [
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
    ],
    {
        beforeLoad: [
            app => {
                console.log('[LifeCycle] before load %c%s', 'color: green;', app.name);
            },
        ],
        beforeMount: [
            app => {
                console.log('[LifeCycle] before mount %c%s', 'color: green;', app.name);
            },
        ],
        afterUnmount: [
            app => {
                console.log('[LifeCycle] after unmount %c%s', 'color: green;', app.name);
            },
        ],
    },
);

/**
 * Step3 设置默认进入的子应用
 */
setDefaultMountApp('/vue3');

/**
 * Step4 启动应用
 */
start();

runAfterFirstMounted(() => {
    console.log('[MainApp] first app mounted');
});