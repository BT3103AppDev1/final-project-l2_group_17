<script>
import AddMenu from "@/components/AddMenu.vue";
import ItemCardAdmin from "@/components/ItemCardAdmin.vue";
import MenuForm from "@/components/MenuForm.vue";
import { db } from "@/firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

export default {
  name: "AdminMenu",
  components: {
    AddMenu,
    ItemCardAdmin,
    MenuForm,
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
  <div class="menu-header-row">
    <h2>Manage Menu</h2>
    <AddMenu v-if="!showAddForm && !showEditForm" @click="toggleAddForm" />
  </div>

  <MenuForm v-if="showAddForm" @close="closeAddForm" @success="handleFormSuccess" />
  <MenuForm v-else-if="showEditForm" :editItem="editingItem" @close="closeEditForm" @success="handleFormSuccess" />

  <div v-else>
    <p v-if="menuItems.length === 0" class="empty-state">No menu items created.</p>

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
.menu-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  margin-top: 30px;
  padding: 0 24px;
  box-sizing: border-box;
}

.menu-header-row h2 {
  margin: 0;
  font-size: 36px;
}

.admin-menu-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  padding: 0 24px;
  box-sizing: border-box;
}

.empty-state {
  margin-top: 16px;
  color: #5d5f69;
  font-size: 24px;
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
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.confirm-modal h3 {
  margin: 0 0 10px;
  font-size: 26px;
}

.confirm-modal p {
  margin: 0;
  color: #474954;
  font-size: 18px;
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
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 16px;
  cursor: pointer;
}

.btn-cancel-modal {
  background: #d9d9dd;
  color: #3d3d45;
}

.btn-delete-modal {
  background: #d93025;
  color: #fff;
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
</style>
