<template>
  <div id="app">
    <h3>基座vue3</h3>
    <div id="nav">
      <router-link to="/vue3">vue3</router-link> |
      <router-link to="/purehtml">purehtml</router-link> |
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <button @click="login()">登录</button>
    <router-view/>
    <div id="subapp-viewport"></div>
  </div>
</template>

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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
