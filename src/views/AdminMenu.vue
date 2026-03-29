<script>
import AddMenu from "@/components/AddMenu.vue";
import MenuForm from "@/components/MenuForm.vue";

export default {
  name: "AdminMenu",
  components: {
    AddMenu,
    MenuForm,
  },
  data() {
    return {
      showAddForm: false,
    };
  },
  methods: {
    toggleAddForm() {
      this.showAddForm = !this.showAddForm;
    },
    closeAddForm() {
      this.showAddForm = false;
    },
  }
};

</script>

<template>
  <div class="menu-header-row">
    <h1>Manage Menu</h1>
    <AddMenu v-if="!showAddForm" @click="toggleAddForm" />
  </div>

  <MenuForm v-if="showAddForm" @close="closeAddForm" />
</template>

<style>
.menu-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
