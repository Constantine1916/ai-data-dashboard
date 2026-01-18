<template>
  <div class="app">
    <header>
      <h1>AI Data Dashboard</h1>
    </header>
    <main>
      <div class="dashboard">
        <p>欢迎使用 AI 数据仪表板</p>
      </div>
    </main>
  </div>
</template>

<script setup>
// 这里可以添加组件逻辑
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 600;
}

main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.dashboard {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard p {
  font-size: 1.2rem;
  color: #333;
  text-align: center;
}
</style>
