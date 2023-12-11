<template>
  <div id="cookie-viewer"
       :style="{ height: `${100 - this.height}%` }"
  >
    <div id="manage-panel">
      <button class="delete-cookie manage-button" @click="onDeleteButton">
        <svg height="18" viewBox="0 -960 960 960" width="18">
          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
        </svg>
        <span>Delete</span>
      </button>
      <button class="save-cookie manage-button" @click="onSaveButton">
        <svg height="18" viewBox="0 -960 960 960" width="18">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
        </svg>
        <span>Save</span>
      </button>
      <Transition name="fade">
        <span class="saved-mark" v-if="isSaved">Saved ✔</span>
      </Transition>
      <span id="closing-cross" title="Close" @click="onCloseButton">×</span>
    </div>
    <div id="fields">
      <template v-for="header in headers">
        <label
            :for="`e-${this.selectedCookie[header.key].key}`"
            class="col-name"
        >
          {{ header.name }}
        </label>
        <dynamic-cell :cookie-field="this.selectedCookie[header.key]"
                      :on-mouse-up="onMouseUp"
                      :on-blur="onBlur"
                      :on-select-change="onSelectChange"
                      :on-key="onKey"
                      :value-as-textarea="header.key === 'value'"
                      place="editor"
        />
      </template>
    </div>
    <div class="buttons-row">
      <button class="delete-cookie manage-button" @click="onDeleteButton">
        <svg height="18" viewBox="0 -960 960 960" width="18">
          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
        </svg>
        <span>Delete</span>
      </button>
      <button class="save-cookie manage-button" @click="onSaveButton">
        <svg height="18" viewBox="0 -960 960 960" width="18">
          <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
        </svg>
        <span>Save</span>
      </button>
      <Transition name="fade">
        <span class="saved-mark" v-if="isSaved">Saved ✔</span>
      </Transition>
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import DynamicCell from "./DynamicCell";
import CellSaver from "../classes/CellSaver";
import CookieConverter from "../classes/CookieConverter";

export default {
  name: "CookieViewer",
  components: { DynamicCell },
  props: {
    height: Number,
  },
  data() {
    return {
      skipSaveOnBlur: false,
      inputValueBeforeEditStarted: '',
      isSaved: false,
      savedMarkTransitionTime: 1000,
    };
  },
  computed: {
    ...mapGetters(['selectedCookie', 'headers', 'hostsTree']),
  },
  methods: {
    onMouseUp(e) {
      this.inputValueBeforeEditStarted = e.target?.value;
    },
    async onBlur(e) {
      if (this.skipSaveOnBlur) {
        this.skipSaveOnBlur = false;
        return;
      }

      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.selectedCookie, this.$store);
    },
    async onSelectChange(e) {
      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.selectedCookie, this.$store);
    },
    onKey(e) {
      const isSubmit = e.code === 'Enter' && (e.target.type !== 'textarea' || e.ctrlKey);

      if (isSubmit) {
        e.target.blur();
      } else if (e.code === 'Escape') {
        this.skipSaveOnBlur = true;
        e.target.value = this.inputValueBeforeEditStarted;
        e.target.blur();
      }
    },

    onDeleteButton() {
      const chromeCookie = CookieConverter.objectToChromeCookie(this.selectedCookie)
      this.$store.dispatch('deleteCookie', {
        name: chromeCookie.name,
        url: chromeCookie.url
      });

      this.$store.dispatch('setSelectedCell', { idx: -1, key: '' });
      this.$store.dispatch('setSelectedCookie', {});
    },
    onSaveButton() {
      this.isSaved = true;
      setTimeout(() => this.isSaved = false, this.savedMarkTransitionTime);
    },
    onCloseButton() {
      this.$store.dispatch('setSelectedCell', { idx: -1, key: '' });
      this.$store.dispatch('setSelectedCookie', {});
    },
  },
}
</script>

<style lang="less" scoped>
  div#cookie-viewer {
    height: 45%;
    padding: 10px 10px 10px 5px;
    box-sizing: border-box;
    border-top: 1px solid #ccc;
    overflow: auto;

    .fade-enter-active,
    .fade-leave-active {
      transition: opacity 0.5s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
      opacity: 0;
    }

    .saved-mark {
      display: inline-flex;
      align-items: center;
      height: 25px;
      margin-left: 10px;
      color: #358940;
      font-size: 14px;
    }

    button.manage-button {
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.03);
      padding: 4px 10px 4px 7px;
      cursor: pointer;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;

      &:active {
        background-color: rgba(0, 0, 0, .1)!important;
      }

      &.delete-cookie {
        background-color: #ffdbdb;
        border-right-color: #e7c1c1;
        border-bottom-color: #e7c1c1;

        &:hover {
          background-color: #e7c1c1;
          border-right-color: #d9b1b1;
          border-bottom-color: #d9b1b1;
        }

        path {
          fill: #de0000;
        }
      }

      &.save-cookie {
        background-color: #b3ffb3;
        border-right-color: #9be09b;
        border-bottom-color: #9be09b;
        margin-left: 5px;

        &:hover {
          background-color: #9be09b;
          border-right-color: #8ccb8c;
          border-bottom-color: #8ccb8c;
        }

        path {
          fill: #17a101;
        }
      }

      span {
        margin-left: 3px;
        color: #333;
      }
    }

    div#manage-panel {
      text-align: right;
      margin-bottom: 10px;

      button.manage-button {
        float: left;
      }

      .saved-mark {
        float: left;
        margin-left: 10px;
      }

      span#closing-cross {
        font-size: 25px;
        line-height: 25px;
        height: 25px;
        width: 25px;
        display: inline-block;
        text-align: center;
        margin-bottom: 10px;
        cursor: pointer;

        &:hover {
          color: #aaa;
          text-shadow: 0 0 1px black;
        }

        &:active {
          color: black;
        }
      }
    }

    #fields {
      display: grid;
      grid-template-columns: 1fr 8fr;
      grid-template-rows: repeat(9, auto);
      grid-gap: 6px 4px;
      align-items: baseline;
      box-sizing: border-box;
      padding-right: 20px;
      padding-left: 5px;

      label.col-name {
        min-height: 22px;
      }

      :deep(.input-cell) {
        border: 1px solid #ccc;
        border-radius: 3px;

        &[type="checkbox"] {
          width: 20px;
          height: 15px;
          margin: 2px 0 0;
          align-self: normal;
        }
      }

      :deep(span.immutable-cell) {
        align-self: baseline;
      }
    }

    div.buttons-row {
      display: flex;
      margin-top: 15px;
      margin-bottom: 10px;
      padding-right: 25px;
    }
  }
</style>