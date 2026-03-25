<script>
import AddMenu from "@/components/AddMenu.vue";

export default {
  name: "AdminMenu",
  components: {
    AddMenu,
  },
  data() {
    return {
      showAddForm: false,
      form: {
        name: "",
        price: "",
        category: "",
        description: "",
        quantity: "",
        imageUrl: ""
      },
    };
  },
  methods: {
    toggleAddForm() {
      this.showAddForm = !this.showAddForm;
    },
    closeAddForm() {
      this.showAddForm = false;
    },
    submitNewMenuItem() {
      // ...existing code...
      // TODO: call API / store action here
      console.log("new menu item:", this.form);

      this.form = { name: "", price: "", category: "", description: "" };
      this.showAddForm = false;
    },
  }
};

</script>

<template>
  <div class="menu-header-row">
    <h1>Manage Menu</h1>
    <AddMenu @click="toggleAddForm" />
  </div>

  <section v-if="showAddForm" class="add-form-panel">
    <h1>Add New Menu Item</h1>
    <form @submit.prevent="submitNewMenuItem" class="add-form">
      <div class="form-row">
        <label for="item-category">Item Category:</label>
        <input
          id="item-category"
          v-model="form.category"
          type="text"
          placeholder="Enter category"
          required
        />
      </div>

      <div class="form-row">
        <label for="item-name">Item Name:</label>
        <input
          id="item-name"
          v-model="form.name"
          type="text"
          placeholder="Enter name"
          required
        />
      </div>

      <div class="form-row">
        <label for="item-price">Price:</label>
        <input
          id="item-price"
          v-model="form.price"
          type="number"
          min="0"
          placeholder="Enter price"
          required
        />
      </div>

      <div class="form-row">
        <label for="item-description">Description:</label>
        <textarea
          id="item-description"
          v-model="form.description"
          rows="2"
          placeholder="Enter description"
        ></textarea>
      </div>

      <div class="form-row">
        <label for="item-quantity">Quantity:</label>
        <input
          id="item-quantity"
          v-model="form.quantity"
          type="number"
          min="0"
          placeholder="Enter quantity"
        />
      </div>

      <div class="form-row">
        <label for="item-image">Image URL:</label>
        <input
          id="item-image"
          v-model="form.imageUrl"
          type="url"
          placeholder="Insert image"
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="closeAddForm">Cancel</button>
        <button type="submit" class="btn-add">Add Item</button>
      </div>
    </form>
  </section>
</template>

<style>
.menu-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-form-panel {
  margin-top: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.add-form-panel h2 {
  margin-bottom: 14px;
}

.add-form {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  column-gap: 14px;
}

.form-row label {
  text-align: right;
  font-weight: 500;
}

.form-row input,
.form-row textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #bdbdbd;
  border-radius: 2px;
  font: inherit;
  box-sizing: border-box;
}

.form-row-top {
  align-items: start;
}

.form-actions {
  margin-top: 8px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn-add,
.btn-cancel {
  font-size: 20px;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn-add {
  background: #ff7300;
  color: #fff;
}

.btn-cancel {
  background: #efefef;
}
</style>
