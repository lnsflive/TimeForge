<template>
  <v-app class="timeforge-auth" theme="dark">
    <main class="auth-stage">
      <slot />
    </main>
  </v-app>
</template>

<style scoped>
.timeforge-auth {
  background: #0f1424;
  color: #fff;
  font-family: 'Rubik', sans-serif;
}
.auth-stage {
  display: grid;
  place-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: clamp(1rem, 4vw, 3rem);
}
</style>
