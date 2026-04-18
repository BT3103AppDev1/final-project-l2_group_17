<template>
  <div class="review-modal-overlay">
    <div class="review-card">
      <header class="review-header">
        <div>
          <h2>Write a Review</h2>
          <p v-if="props.itemName" class="review-subtitle">Item: {{ props.itemName }}</p>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>

      <div class="form-content">
        <div class="form-group">
          <label>Rating <span class="required">*</span></label>
          <div class="star-rating">
            <span
              v-for="star in 5"
              :key="star"
              class="star"
              :class="{ active: star <= rating, hovered: star <= hoverRating }"
              @mouseover="hoverRating = star"
              @mouseleave="hoverRating = 0"
              @click="setRating(star)"
            >
              ★
            </span>
          </div>
          <p v-if="showError && rating === 0" class="error-msg">Please select a rating.</p>
        </div>

        <div class="form-group">
          <label>Your Review <span class="required">*</span></label>
          <textarea
            v-model="reviewText"
            :placeholder="reviewPlaceholder"
            class="styled-textarea"
          />
          <p v-if="showError && reviewText.trim() === ''" class="error-msg">
            Please write a review.
          </p>
        </div>

        <div class="form-group">
          <label>Add a Photo (Optional)</label>

          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            class="hidden-input"
            @change="handleImageSelected"
          />

          <button
            v-if="!imagePreview"
            type="button"
            class="upload-btn"
            @click="fileInput?.click()"
          >
            Upload Image
          </button>

          <div v-else class="image-preview-container">
            <img :src="imagePreview" alt="Preview" class="image-preview" />
            <button type="button" class="remove-image-btn" @click="removeImage">
              Remove
            </button>
          </div>
        </div>
      </div>

      <footer class="review-footer">
        <button type="button" class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button
          type="button"
          class="submit-btn"
          :disabled="props.isSubmitting"
          @click="submitReview"
        >
          {{ props.isSubmitting ? 'Posting...' : 'Post Review' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  itemName: {
    type: String,
    default: '',
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const rating = ref(0)
const hoverRating = ref(0)
const reviewText = ref('')
const imagePreview = ref(null)
const base64Image = ref(null)
const showError = ref(false)
const fileInput = ref(null)

const reviewPlaceholder = computed(() =>
  `What did you think about${props.itemName ? ` ${props.itemName}` : ' this item'}? Tell other customers about your experience.`,
)

function setRating(stars) {
  rating.value = stars
}

function handleImageSelected(event) {
  const file = event.target.files?.[0]

  if (!file) return

  if (file.size > 500 * 1024) {
    alert('Image is too large. Please select an image under 500KB.')
    event.target.value = ''
    return
  }

  imagePreview.value = URL.createObjectURL(file)

  const reader = new FileReader()
  reader.onload = (readerEvent) => {
    base64Image.value = readerEvent.target?.result || null
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = null
  base64Image.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function submitReview() {
  if (props.isSubmitting) {
    return
  }

  if (rating.value === 0 || reviewText.value.trim() === '') {
    showError.value = true
    return
  }

  showError.value = false
  emit('submit', {
    rating: rating.value,
    text: reviewText.value.trim(),
    imageUrl: base64Image.value,
  })
}
</script>

<style scoped>
.review-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.review-card {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.review-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.review-header h2,
.review-subtitle {
  margin: 0;
}

.review-header h2 {
  font-size: 1.5rem;
  color: #333;
}

.review-subtitle {
  margin-top: 6px;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #888;
}

.form-content {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
}

.required {
  color: #e74c3c;
}

.error-msg {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 4px;
}

.star-rating {
  display: flex;
  gap: 8px;
  font-size: 2rem;
  cursor: pointer;
  color: #e0e0e0;
}

.star {
  transition: color 0.2s;
  user-select: none;
}

.star.active,
.star.hovered {
  color: #f77519;
}

.styled-textarea {
  width: 100%;
  height: 120px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: none;
  font-family: inherit;
  box-sizing: border-box;
}

.styled-textarea:focus {
  outline: none;
  border-color: #f77519;
}

.hidden-input {
  display: none;
}

.upload-btn {
  background: #f5f5f5;
  border: 1px dashed #ccc;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #555;
  width: 100%;
}

.upload-btn:hover {
  background: #eee;
}

.image-preview-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.image-preview {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.remove-image-btn {
  background: #ffebee;
  color: #c62828;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.review-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
}

.cancel-btn {
  background: none;
  border: none;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  padding: 10px 16px;
}

.submit-btn {
  background: #f77519;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
