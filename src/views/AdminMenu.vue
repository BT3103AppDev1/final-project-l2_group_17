<script>
import AddMenu from "@/components/AddMenuButton.vue";
import ItemCardAdmin from "@/components/ItemCardAdmin.vue";
import MenuForm from "@/components/MenuForm.vue";
import NavAdmin from "@/components/NavAdmin.vue";
import { db } from "@/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

export default {
  name: "AdminMenu",
  components: {
    AddMenu,
    ItemCardAdmin,
    MenuForm,
    NavAdmin
  },
  data() {
    return {
      showAddForm: false,
      showEditForm: false,
      editingItem: null,
      showDeleteConfirm: false,
      pendingDeleteItemId: null,
      pendingDeleteItemName: "",
      showSuccessNotice: false,
      successMessage: "",
      successNoticeTimer: null,
      menuItems: [],
    };
  },
  beforeUnmount() {
    if (this.successNoticeTimer) {
      clearTimeout(this.successNoticeTimer);
    }
  },
  async mounted() {
    await this.fetchMenuItems();
  },
  methods: {
    toggleAddForm() {
      this.showAddForm = !this.showAddForm;
    },
    async closeAddForm() {
      this.showAddForm = false;
      await this.fetchMenuItems();
    },
    async fetchMenuItems() {
      const snapshot = await getDocs(collection(db, "MenuItems"));
      this.menuItems = snapshot.docs.map((menuItemDoc) => ({
        id: menuItemDoc.id,
        ...menuItemDoc.data(),
      }));
    },
    handleEdit(itemId) {
      const item = this.menuItems.find(m => m.id === itemId);
      if (item) {
        this.editingItem = item;
        this.showEditForm = true;
      }
    },
    async closeEditForm() {
      this.showEditForm = false;
      this.editingItem = null;
      await this.fetchMenuItems();
    },
    handleFormSuccess(message) {
      this.successMessage = message;
      this.showSuccessNotice = true;

      if (this.successNoticeTimer) {
        clearTimeout(this.successNoticeTimer);
      }

      this.successNoticeTimer = setTimeout(() => {
        this.showSuccessNotice = false;
        this.successMessage = "";
        this.successNoticeTimer = null;
      }, 3000);
    },
    handleDelete(itemId) {
      const item = this.menuItems.find((menuItem) => menuItem.id === itemId);
      this.pendingDeleteItemId = itemId;
      this.pendingDeleteItemName = item?.ItemName || "this menu item";
      this.showDeleteConfirm = true;
    },
    cancelDelete() {
      this.showDeleteConfirm = false;
      this.pendingDeleteItemId = null;
      this.pendingDeleteItemName = "";
    },
    async confirmDelete() {
      if (!this.pendingDeleteItemId) {
        return;
      }

      const deletedItemName = this.pendingDeleteItemName;
      await deleteDoc(doc(db, "MenuItems", this.pendingDeleteItemId));
      this.menuItems = this.menuItems.filter((item) => item.id !== this.pendingDeleteItemId);
      this.cancelDelete();
      this.handleFormSuccess(`${deletedItemName} deleted successfully.`);
    },
  }
};

</script>

<template>
  <NavAdmin />
  <section class="page-shell">
    <header class="page-header">
      <div>
        <h1>Manage menu</h1>
        <p class="body-copy">
          Add, edit, and remove menu items while keeping details consistent for customers.
        </p>
      </div>

      <div class="header-actions">
        <!-- <div class="summary-card">
          <span class="summary-label">Menu items</span>
          <strong class="summary-value">{{ menuItems.length }}</strong>
        </div> -->
        <AddMenu v-if="!showAddForm && !showEditForm" @click="toggleAddForm" />
      </div>
    </header>

    <MenuForm v-if="showAddForm" @close="closeAddForm" @success="handleFormSuccess" />
    <MenuForm v-else-if="showEditForm" :editItem="editingItem" @close="closeEditForm" @success="handleFormSuccess" />

    <div v-else>
      <p v-if="menuItems.length === 0" class="message-card">No menu items created.</p>

      <section v-else class="admin-menu-grid">
        <ItemCardAdmin
          v-for="item in menuItems"
          :key="item.id"
          :id="item.id"
          :ItemName="item.ItemName"
          :Price="item.Price"
          :ItemCategory="item.ItemCategory"
          :ItemDescription="item.ItemDescription"
          :imageUrl="item.imageUrl"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </section>
    </div>
  </section>
  
  <!--Delete confirmation message-->
  <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
    <div class="confirm-modal">
      <h3>Delete {{ pendingDeleteItemName }}</h3>
      <p>Are you sure you want to delete this menu item?</p>
      <div class="confirm-actions">
        <button type="button" class="btn-cancel-modal" @click="cancelDelete">Cancel</button>
        <button type="button" class="btn-delete-modal" @click="confirmDelete">Delete</button>
      </div>
    </div>
  </div>

  <div v-if="showSuccessNotice" class="notice-wrap">
    <div class="success-notice">{{ successMessage }}</div>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 20px;
}

.page-header,
.summary-card,
.message-card,
.confirm-modal {
  border: 1px solid rgba(91, 57, 36, 0.12);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 32px rgba(96, 63, 30, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  padding: 28px;
  border-radius: 28px;
}

h1,
.body-copy,
.summary-label,
.summary-value,
.message-card {
  margin: 0;
}

h1 {
  color: #3f220f;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.body-copy {
  margin-top: 12px;
  color: #6f5545;
  max-width: 720px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-card {
  min-width: 140px;
  padding: 18px;
  border-radius: 24px;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #8d684e;
}

.summary-value {
  display: block;
  margin-top: 8px;
  font-size: 2rem;
  color: #472715;
}

.admin-menu-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.message-card {
  padding: 18px 20px;
  border-radius: 24px;
  color: #6f5545;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.confirm-modal {
  width: min(92vw, 420px);
  border-radius: 24px;
  padding: 24px;
}

.confirm-modal h3 {
  margin: 0 0 10px;
  color: #3f220f;
  font-size: 1.5rem;
}

.confirm-modal p {
  margin: 0;
  color: #6f5545;
  font-size: 1rem;
}

.confirm-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel-modal,
.btn-delete-modal {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel-modal {
  background: #ecd5c4;
  color: #5d3522;
}

.btn-delete-modal {
  background: #c94f4f;
  color: #fff8ef;
}

.notice-wrap {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.success-notice {
  background: #1f8b4c;
  color: #fff;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 820px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
