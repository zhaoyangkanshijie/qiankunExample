<template>
  <div class="about-content">
    <h1>This is about page</h1>
    <button @click="changeToken()">changeToken</button>
  </div>
</template>

<script>
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
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.about-content {
  color: #7265e6;
}
</style>
