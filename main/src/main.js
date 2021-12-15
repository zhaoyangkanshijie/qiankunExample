import { createApp } from 'vue'
import App from './App.vue'
import { registerMicroApps, runAfterFirstMounted, setDefaultMountApp, start, initGlobalState } from 'qiankun';

createApp(App).mount('#app')

registerMicroApps(
    [
        {
            name: 'vue3',
            entry: '//localhost:7105',
            container: '#subapp-viewport',
            activeRule: '/vue3',
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

const { onGlobalStateChange, setGlobalState } = initGlobalState({
    user: 'qiankun',
});

onGlobalStateChange((value, prev) => console.log('[onGlobalStateChange - master]:', value, prev));

setGlobalState({
    ignore: 'master',
    user: {
        name: 'master',
    },
});

/**
 * Step3 设置默认进入的子应用
 */
setDefaultMountApp('/vue3/about');

/**
 * Step4 启动应用
 */
start();

runAfterFirstMounted(() => {
    console.log('[MainApp] first app mounted');
});