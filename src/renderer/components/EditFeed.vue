<template>
  <b-modal
    id="editFeed"
    ref="editFeed"
    title="Edit Feed"
    @hidden="onHidden"
    centered
  >
    <b-form-group
      id="subscription-group"
      label="Title"
    >
      <b-form-input type="text" v-model="feed.title"></b-form-input>
    </b-form-group>
    <b-form-group
      id="subscription-group"
      label="Category"
    >
    <b-form-select v-model="feed.category" :options="categoryItems" class="mb-3">
            <template slot="first">
              <option :value="null">Please select category</option>
            </template>
          </b-form-select>
          <p><button class="btn btn-link pl-0" type="button" @click="addCategory">Add new category</button></p>
          <p v-if="showAddCat"><b-form-input v-model="newcategory" placeholder="Enter new category"></b-form-input></p>
    </b-form-group>
    <div slot="modal-footer">
      <button type="button" class="btn btn-secondary" @click="hideModal">Cancel</button>
      <button type="button" class="btn btn-primary" @click="updateSubscriptionTitle">Update</button>
    </div>
  </b-modal>
</template>
<script>
import uuid from 'uuid-by-string'

export default {
  props: {
    feed: {
      type: Object
    }
  },
  computed: {
    categoryItems () {
      return this.$store.state.Category.categories.map((item) => {
        return { value: item.title, text: item.title }
      })
    }
  },
  data () {
    return {
      newcategory: null,
      showAddCat: false
    }
  },
  methods: {
    addCategory () {
      this.showAddCat = !this.showAddCat
    },
    hideModal () {
      this.$refs.editFeed.hide()
    },
    updateSubscriptionTitle () {
      if (this.newcategory) {
        this.$store.dispatch('addCategory', { id: uuid(this.newcategory), title: this.newcategory, type: 'category' })
      } else {
        this.newcategory = this.feed.category
      }
      this.$store.dispatch('updateFeedTitle', {
        title: this.feed.title,
        category: this.newcategory,
        id: this.feed.id
      })
      this.$store.dispatch('updateArticleFeedTitle', {
        category: this.newcategory,
        title: this.feed.title,
        id: this.feed.id
      })
      this.$toasted.show('Subscription title updated.', {
        theme: 'outline',
        position: 'top-center',
        duration: 3000
      })
      this.hideModal()
    },
    onHidden () {
      this.newcategory = null
      this.showAddCat = null
    }
  }
}
</script>