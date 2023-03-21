<template>
  <div id="cookie-viewer"
       :style="{ height: `${100 - this.height}%` }"
  >
    <div id="manage-panel">
      <button id="delete-cookie" @click="onDeleteButton">🗑️ Delete Cookie</button>
      <span id="closing-cross" title="Close" @click="onCloseButton">×</span>
    </div>
    <div id="fields">
      <template v-for="header in headers">
        <span class="col-name">{{ header.name }}</span>
        <dynamic-cell :cookie-field="this.selectedCookie[header.key]"
                      :on-mouse-up="this.onMouseUp"
                      :on-blur="this.onBlur"
                      :on-select-change="this.onSelectChange"
                      :on-key="this.onKey"
                      :value-as-textarea="header.key === 'value'"
        />
      </template>
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
        e.target.value = this.inputValueBeforeEditStarted;
        return;
      }

      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.selectedCookie, this.$store);
    },
    async onSelectChange(e) {
      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.selectedCookie, this.$store);
    },
    async onKey(e) {
      if (e.code === 'Enter' && e.target.type !== 'textarea') {
        e.target.blur();
      } else if (e.code === 'Escape') {
        this.skipSaveOnBlur = true;
        e.target.blur();
      }
    },

    onDeleteButton() {
      const chromeCookie = CookieConverter.objectToChromeCookie(this.selectedCookie)
      this.$store.dispatch('deleteCookie', {
        name: chromeCookie.name,
        url: chromeCookie.url
      });

      this.$store.dispatch('setSelectedCellIdx', -1);
      this.$store.dispatch('setSelectedCookie', {});
    },
    onCloseButton() {
      this.$store.dispatch('setSelectedCellIdx', -1);
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

    div#manage-panel {
      text-align: right;

      button#delete-cookie {
        float: left;
        background: white;
        border-radius: 3px;
        border: 1px solid #833;
        padding: 3px 5px;
        cursor: pointer;
        color: #833;
        box-sizing: border-box;

        &:hover {
          background-color: #fffafafa;
          border-color: #a55;
          color: #a55;
        }

        &:active {
          background-color: #caa;
          border-width: 2px;
          padding: 2px 4px;
          border-color: #500;
          color: #500;
        }
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
  }
</style>