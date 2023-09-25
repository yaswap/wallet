<template>
  <div class="notification-content">
    <div style="white-space: pre-line;">
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notification-content {
  height: fit-content;
  display: flex;
  flex-direction: column;
  width: 100%;
  justify-content: center;
  .liq-telegram-btn {
    margin-left: 4px;
    width: 130px;
    display: inline-block;
  }
}
</style>
