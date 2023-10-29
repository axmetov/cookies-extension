<template>
  <div id="cookie-viewer"
       :style="{ height: `${100 - this.height}%` }"
       :class="{'positive-feedback': isPositiveFeedback}"
  >
    <div id="manage-panel">
      <button class="delete-cookie manage-button" @click="onDeleteButton">🗑️ Delete</button>
      <button class="save-cookie manage-button" @click="onSaveButton">✔ Save</button>
      <Transition name="fade">
        <span class="saved-mark" v-if="isSaved">Saved ✔</span>
      </Transition>
      <span id="closing-cross" title="Close" @click="onCloseButton">×</span>
    </div>
    <div id="fields">
      <template v-for="header in headers">
        <span class="col-name">{{ header.name }}</span>
        <dynamic-cell :cookie-field="this.selectedCookie[header.key]"
                      :on-mouse-up="onMouseUp"
                      :on-blur="onBlur"
                      :on-select-change="onSelectChange"
                      :on-key="onKey"
                      :value-as-textarea="header.key === 'value'"
        />
      </template>
    </div>
    <div class="buttons-row">
      <Transition name="fade">
        <span class="saved-mark" v-if="isSaved">Saved ✔</span>
      </Transition>
      <button class="delete-cookie manage-button" @click="onDeleteButton">🗑️ Delete</button>
      <button class="save-cookie manage-button" @click="onSaveButton">✔ Save</button>
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
      isPositiveFeedback: false,
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
        // visual feedback on successful save
        this.isPositiveFeedback = true;
        setTimeout(() => this.isPositiveFeedback = false, 200);
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
    transition: background-color 150ms ease-in-out;

    &.positive-feedback {
      background-color: #e7ffdf;
    }

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
      margin-right: 10px;
      color: #358940;
      font-size: 14px;
    }

    button.manage-button {
      background: white;
      border-radius: 3px;
      padding: 3px 5px;
      cursor: pointer;
      box-sizing: border-box;

      &:active {
        border-width: 2px;
        padding: 2px 4px;
      }

      &.delete-cookie {
        border: 1px solid #833;
        color: #833;

        &:hover {
          background-color: #fffafafa;
          border-color: #a55;
          color: #a55;
        }

        &:active {
          background-color: #caa;
          border-color: #500;
          color: #500;
        }
      }

      &.save-cookie {
        border: 1px solid #33883e;
        color: #33883e;
        margin-left: 5px;

        &:hover {
          background-color: #FFFAFAF9;
          border-color: #5baa55;
          color: #5baa55;
        }

        &:active {
          background-color: #afccaa;
          border-color: #095500;
          color: #095500;
        }
      }
    }

    div#manage-panel {
      text-align: right;

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
      grid-gap: 4px 0;
      align-items: center;
      box-sizing: border-box;
      padding-right: 25px;

      span.col-name {
        align-self: baseline;
      }

      :deep(input) {
        &.input-cell {
          border: 1px solid #ccc;
          border-radius: 3px;
        }

        &[type="checkbox"] {
          margin: 0;
          width: 20px;
          align-self: center;
        }
      }

      :deep(span.immutable-cell) {
        align-self: baseline;
      }
    }

    div.buttons-row {
      text-align: right;
      margin-top: 15px;
      margin-bottom: 10px;
      padding-right: 25px;

      button.save-cookie {
        &:active {
          margin-left: 7px;
        }
      }
    }
  }
</style>