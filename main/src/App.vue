<template>
  <div id="app">
    <h3>基座vue3</h3>
    <div id="nav">
      <span @click="push('/vue3')">vue3</span> |
      <span @click="push('/purehtml')">purehtml</span> 
    </div>
    <div id="subapp-viewport"></div>
  </div>
</template>

<script>
export default {
  name: 'App',
  setup() {
    const push = (subapp) => {
      history.pushState(null, subapp, subapp);
    }

    return {
      push
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
