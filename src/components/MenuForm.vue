<script>
import { db } from "@/firebase.js";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";

export default {
  name: "MenuForm",
  props: {
    editItem: {
      type: Object,
      default: null,
    },
    isReadOnly: {
      type: Boolean,
      default: false,
    },
    disabledMessage: {
      type: String,
      default: "",
    },
  },
  emits: ["close", "success"],
  data() {
    return {
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
  computed: {
    isEditMode() {
      return this.editItem !== null;
    },
    isFormValid() {
      return [
        this.form.name,
        this.form.category,
        this.form.description,
        this.form.price,
        this.form.imageUrl,
        this.form.quantity,
      ].every((value) => String(value ?? "").trim() !== "");
    },
    formTitle() {
      return this.isEditMode ? "Edit Item" : "Add New Item";
    },
    submitButtonText() {
      return this.isEditMode ? "Save Changes" : "Add Item";
    },
  },
  mounted() {
    if (this.isEditMode) {
      this.form = {
        name: this.editItem.ItemName || "",
        price: this.editItem.Price || "",
        category: this.editItem.ItemCategory || "",
        description: this.editItem.ItemDescription || "",
        quantity: this.editItem.quantity || "",
        imageUrl: this.editItem.imageUrl || "",
      };
    }
  },
  methods: {
    handleCancel() {
      this.$emit("close");
    },
    async submitItem() {
      if (this.isReadOnly || !this.isFormValid) {
        return;
      }

      const name = this.form.name;
      const category = this.form.category;
      const description = this.form.description;
      const priceValue = this.form.price;
      const quantityValue = this.form.quantity;
      const imageUrl = this.form.imageUrl;

      try {
        if (this.isEditMode) {
          const itemRef = doc(db, "MenuItems", this.editItem.id);
          await updateDoc(itemRef, {
            ItemName: name,
            ItemCategory: category,
            ItemDescription: description,
            Price: priceValue,
            quantity: Number(quantityValue),
            imageUrl: imageUrl,
          });
          this.$emit("success", "Menu item updated successfully.");
        } else {
          console.log("Saving to Firestore:", {
            name,
            category,
            description,
            price: Number(Number(priceValue).toFixed(2)),
            quantity: Number(quantityValue),
            imageUrl,
          });

          await addDoc(collection(db, "MenuItems"), {
            ItemName: name,
            ItemCategory: category,
            ItemDescription: description,
            Price: priceValue,
            quantity: Number(quantityValue),
            imageUrl: imageUrl,
            createdAt: serverTimestamp(),
          });

          this.$emit("success", "Menu item added successfully.");
        }
      } catch (error) {
        const action = this.isEditMode ? "update" : "add";
        alert(`Failed to ${action} menu item: ` + error.message);
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

      this.$emit("close");
    },
  },
};
</script>

<template>
  <section class="add-form-panel">
    <h2>{{ formTitle }}</h2>
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
            :disabled="isReadOnly"
          />
        </div>

        <div class="form-row">
          <label for="item-category">Category</label>
          <select
            id="item-category"
            v-model="form.category"
            required
            :disabled="isReadOnly"
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
            :disabled="isReadOnly"
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
            :disabled="isReadOnly"
          />
        </div>

        <div class="form-row">
          <label for="item-image">Image URL</label>
          <input
            id="item-image"
            v-model="form.imageUrl"
            type="text"
            placeholder="Enter image URL"
            :disabled="isReadOnly"
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
            :disabled="isReadOnly"
          />
        </div>
      </div>

      <div class="form-actions">
        <span :title="isReadOnly ? disabledMessage : ''">
          <button
            type="button"
            class="btn-add"
            :disabled="isReadOnly || !isFormValid"
            @click="submitItem"
          >
            {{ submitButtonText }}
          </button>
        </span>
        <button type="button" class="btn-cancel" @click="handleCancel">Cancel</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.add-form-panel {
  margin-top: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(91, 57, 36, 0.12);
  border-radius: 24px;
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
  padding: 24px;
  box-sizing: border-box;
}

.add-form-panel h2 {
  margin: 0 0 18px 0;
  font-size: 1.6rem;
  color: #3f220f;
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
  font-size: 0.95rem;
  color: #8d684e;
}

.form-row input,
.form-row textarea,
.form-row select {
  width: 100%;
  padding: 16px 18px;
  border: 1px solid #d8c3b4;
  border-radius: 12px;
  background: #fff;
  font: inherit;
  box-sizing: border-box;
  color: #472715;
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
  font-size: 0.95rem;
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 700;
  cursor: pointer;
}

.btn-add {
  background: #b85c38;
  color: #fff8ef;
}

.btn-add:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-cancel {
  background: #ecd5c4;
  color: #5d3522;
}
</style>
