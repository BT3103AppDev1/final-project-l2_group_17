<template>
  <div class="wrapper">
    <div class="card">
      <!-- Tab buttons to select login or registering -->
      <div class="tabs">
        <!-- Login button -->
        <button :class="['tab', { active: !isRegistering }]"
          @click="isRegistering = false"
        >
        Login
        </button>
        
        <!-- Register button -->
        <button :class="['tab', { active: isRegistering }]"
          @click="isRegistering = true"
        >
        Register
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>

</script>