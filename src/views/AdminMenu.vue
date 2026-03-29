<script>
import AddMenu from "@/components/AddMenu.vue";
import { db } from "../firebase.js";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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
        imageUrl: "",
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
    async submitItem() {
      const name = document.getElementById("item-name").value
      const category = document.getElementById("item-category").value
      const description = document.getElementById("item-description").value
      const priceValue = document.getElementById("item-price").value
      const quantityValue = document.getElementById("item-quantity").value
      const imageUrl = document.getElementById("item-image").value

      // Validation
      if (!name || !category || !priceValue) {
        alert("Please fill in all required fields (Name, Category, Price)");
        return;
      }

      alert("saving your data for menu item")

      try {
        console.log("Saving to Firestore:", { name, category, description, price: Number(Number(priceValue).toFixed(2)), quantity: Number(quantityValue), imageUrl });
        
        await addDoc(collection(db, "menuItems"), {
          name,
          category,
          description,
          price: Number(Number(priceValue).toFixed(2)),
          quantity: Number(quantityValue) || 0,
          imageUrl,
          createdAt: serverTimestamp(),
        });

        alert("Menu item added successfully.");
      } catch (error) {
        console.error("Failed to add menu item:", error);
        console.error("Error message:", error.message);
        alert("Failed to add menu item: " + error.message);
        return;
      }

      this.form = {
        name: "",
        price: "",
        category: "",
        description: "",
        quantity: "",
        imageUrl: "",
      };

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
    <h2>Add New Item</h2>
    <form class="add-form">
      <div class="form-grid">
        <div class="form-row">
          <label for="item-name">Item Name</label>
          <input
            id="item-name"
            v-model="form.name"
            type="text"
            placeholder="Enter name"
            required
          />
        </div>

        <div class="form-row">
          <label for="item-category">Category</label>
          <select
            id="item-category"
            v-model="form.category"
            required
          >
            <option disabled value="">Select category</option>
            <option value="Main Course">Main Course</option>
            <option value="Bakery">Bakery</option>
            <option value="Desserts">Desserts</option>
            <option value="Salads">Salads</option>
            <option value="Beverages">Beverages</option>
          </select>
        </div>

        <div class="form-row form-row-full">
          <label for="item-description">Description</label>
          <textarea
            id="item-description"
            v-model="form.description"
            rows="4"
            placeholder="Enter description"
          ></textarea>
        </div>

        <div class="form-row">
          <label for="item-price">Price ($)</label>
          <input
            id="item-price"
            v-model="form.price"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter price"
            required
          />
        </div>

        <div class="form-row">
          <label for="item-image">Image URL</label>
          <input
            id="item-image"
            v-model="form.imageUrl"
            type="text"
            placeholder="Enter image URL"
          />
        </div>

        <div class="form-row form-row-full">
          <label for="item-quantity">Quantity</label>
          <input
            id="item-quantity"
            v-model="form.quantity"
            type="number"
            min="0"
            placeholder="Enter quantity"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-add" v-on:click="submitItem">Add Item</button>
        <button type="button" class="btn-cancel" @click="closeAddForm">Cancel</button>
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
  margin-top: 20px;
  width: 100%;
  background: #f4f4f5;
  border: 1px solid #e2e2e2;
  border-radius: 18px;
  padding: 24px;
  box-sizing: border-box;
}

.add-form-panel h2 {
  margin: 0 0 18px 0;
  font-size: 30px;
}

.add-form {
  width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row-full {
  grid-column: 1 / -1;
}

.form-row label {
  text-align: left;
  font-weight: 700;
  font-size: 18px;
}

.form-row input,
.form-row textarea,
.form-row select {
  width: 100%;
  padding: 16px 18px;
  border: 1px solid #c8c8cf;
  border-radius: 14px;
  background: #fff;
  font: inherit;
  box-sizing: border-box;
}

.form-row textarea {
  min-height: 120px;
  resize: vertical;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-start;
  gap: 12px;
}

.btn-add,
.btn-cancel {
  font-size: 20px;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  cursor: pointer;
}

.btn-add {
  background: #ff7300;
  color: #fff;
}

.btn-cancel {
  background: #d9d9dd;
  color: #3d3d45;
}
</style>
