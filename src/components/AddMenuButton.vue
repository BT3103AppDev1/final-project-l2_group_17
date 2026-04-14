<script>
export default {
  name: 'AddMenu',
};
</script>

<template>
  <button type="button" class="add-item" aria-label="Add Item">
    <span class="plus">+</span>
    <span>Add Item</span>
  </button>
</template>

<style scoped>
.add-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 999px;
  background: #b85c38;
  color: #fff8ef;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.plus {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1;
  transform: translateY(-0.5px);
}

.add-item:hover {
  background: #a7502f;
}
</style>
