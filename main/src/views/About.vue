<template>
  <div class="about-content">
    <h1>This is about page</h1>
    <button @click="login()">redux login</button>
  </div>
</template>

<script>
import { onMounted } from "vue";
import shared from "../shared/index";
export default {
  name: "About",
  setup() {
    const login = () => {
      shared.setToken("reduxToken");
    };

    onMounted(() => {
      const token = shared.getToken();
      console.log("receive redux token2", token);
    });

    return {
      login,
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.about-content {
  color: #7265e6;
}
</style>
