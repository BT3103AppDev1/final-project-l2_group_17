<template>
  <div class="review-modal-overlay">
    <div class="review-card">
      <header class="review-header">
        <h2>Write a Review</h2>
        <button class="close-btn" @click="$emit('close')">✖</button>
      </header>

      <div class="form-content">
        <div class="form-group">
          <label>Overall Rating <span class="required">*</span></label>
          <div class="star-rating">
            <span 
              v-for="star in 5" 
              :key="star" 
              class="star" 
              :class="{ 'active': star <= rating, 'hovered': star <= hoverRating }"
              @mouseover="hoverRating = star"
              @mouseleave="hoverRating = 0"
              @click="setRating(star)"
            >
              ★
            </span>
          </div>
          <p class="error-msg" v-if="showError && rating === 0">Please select a rating.</p>
        </div>

        <div class="form-group">
          <label>Your Review <span class="required">*</span></label>
          <textarea 
            v-model="reviewText" 
            placeholder="What did you think about this order? Tell others about your experience."
            class="styled-textarea"
          ></textarea>
          <p class="error-msg" v-if="showError && reviewText.trim() === ''">Please write a review.</p>
        </div>

        <div class="form-group">
          <label>Add a Photo (Optional)</label>
          
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/*" 
            @change="handleImageSelected" 
            class="hidden-input"
          >
          
          <button v-if="!imagePreview" @click="$refs.fileInput.click()" class="upload-btn">
            📷 Upload Image
          </button>

          <div v-else class="image-preview-container">
            <img :src="imagePreview" alt="Preview" class="image-preview" />
            <button @click="removeImage" class="remove-image-btn">🗑️ Remove</button>
          </div>
        </div>
      </div>

      <footer class="review-footer">
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button class="submit-btn" @click="submitReview" :disabled="isSubmitting">
          {{ isSubmitting ? 'Posting...' : 'Post Review' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'submit']);

// --- Form State ---
const rating = ref(0);
const hoverRating = ref(0);
const reviewText = ref('');
const imagePreview = ref(null);
const base64Image = ref(null); // NEW: Holds the text-version of the image

const isSubmitting = ref(false);
const showError = ref(false);

// --- Logic ---
const setRating = (stars) => {
  rating.value = stars;
};

const handleImageSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 1. Enforce a size limit (~500KB) to prevent Firestore 1MB document crash
    if (file.size > 500 * 1024) {
      alert("Image is too large! Please select an image under 500KB.");
      event.target.value = ''; // clear the input
      return;
    }

    // 2. Create the visual preview
    imagePreview.value = URL.createObjectURL(file); 

    // 3. Convert the file to a Base64 string URL for Firestore
    const reader = new FileReader();
    reader.onload = (e) => {
      base64Image.value = e.target.result; // This is the data URL
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = () => {
  imagePreview.value = null;
  base64Image.value = null;
};

// --- Submission ---
const submitReview = () => {
  if (rating.value === 0 || reviewText.value.trim() === '') {
    showError.value = true;
    return;
  }
  
  showError.value = false;
  isSubmitting.value = true;

  // Package the data to send to CustomerOrders.vue
  const reviewData = {
    rating: rating.value,
    text: reviewText.value,
    imageUrl: base64Image.value // Sending the text-based image URL!
  };

  emit('submit', reviewData);
};
</script>


<style scoped>
/* Overlay to darken the background */
.review-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5); display: flex;
  align-items: center; justify-content: center; z-index: 1000;
}

.review-card {
  background: white; border-radius: 16px; width: 100%; max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; flex-direction: column;
}

.review-header {
  padding: 20px 24px; border-bottom: 1px solid #eee; display: flex;
  justify-content: space-between; align-items: center;
}
.review-header h2 { margin: 0; font-size: 1.5rem; color: #333; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888; }

.form-content { padding: 24px; }
.form-group { margin-bottom: 24px; }
.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #444; }
.required { color: #e74c3c; }
.error-msg { color: #e74c3c; font-size: 0.85rem; margin-top: 4px; }

/* Stars */
.star-rating { display: flex; gap: 8px; font-size: 2rem; cursor: pointer; color: #e0e0e0; }
.star { transition: color 0.2s; }
.star.active, .star.hovered { color: #f97316; }

/* Textarea */
.styled-textarea {
  width: 100%; height: 120px; padding: 12px; border: 1px solid #ddd;
  border-radius: 8px; font-size: 1rem; resize: none; font-family: inherit;
  box-sizing: border-box;
}
.styled-textarea:focus { outline: none; border-color: #f97316; }

/* File Upload */
.hidden-input { display: none; }
.upload-btn {
  background: #f5f5f5; border: 1px dashed #ccc; padding: 12px 24px;
  border-radius: 8px; cursor: pointer; font-weight: 600; color: #555; width: 100%;
}
.upload-btn:hover { background: #eee; }

.image-preview-container { display: flex; align-items: center; gap: 16px; }
.image-preview { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
.remove-image-btn { background: #ffebee; color: #c62828; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }

/* Footer */
.review-footer {
  padding: 16px 24px; border-top: 1px solid #eee; display: flex;
  justify-content: flex-end; gap: 12px; background: #fafafa; border-radius: 0 0 16px 16px;
}
.cancel-btn { background: none; border: none; font-weight: 600; color: #666; cursor: pointer; padding: 10px 16px; }
.submit-btn {
  background: #f97316; color: white; border: none; padding: 10px 24px;
  border-radius: 8px; font-weight: bold; cursor: pointer;
}
.submit-btn:disabled { background: #ccc; cursor: not-allowed; }
</style>