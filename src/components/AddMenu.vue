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
  gap: 5px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: var(--col-main);
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

.plus {
  font-size: 30px;
  font-weight: 500;
  line-height: 1;
  transform: translateY(-1px);
}

.add-item-btn:hover {
  background: var(--col-hover);
}
</style>
