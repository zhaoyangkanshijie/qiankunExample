<template>
  <div id="app">
    <h3>子应用vue3</h3>
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
  </div>
</template>

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
