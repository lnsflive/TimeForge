<template>
  <v-footer color="primary" app class="rounded-t-lg px-4">
    <v-row no-gutters justify="center" align="center">
      <v-col cols="12" class="text-center">
        <span class="text-caption"
          >&copy; {{ new Date().getFullYear() }} TimeForge. All Rights Reserved</span
        >
      </v-col>
    </v-row>
  </v-footer>
</template>

<style scoped>
.v-footer {
  height: 66px !important;
  border-top-left-radius: 12px !important;
  border-top-right-radius: 12px !important;
}

.text-caption {
  font-size: 0.875rem !important;
  font-weight: 400;
  line-height: 1.25rem;
  letter-spacing: 0.0333333333em !important;
}
</style>
