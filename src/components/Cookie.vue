<template>
  <div class="cookie"
       :class="{focused: cookieHash === selectedCookieHash}"
       ref="cookieRow"
       :data-hash="cookieHash"
  >
    <div class="cell"
         v-for="(cookieField, cookieFieldKey, cellIdx) in this.cookieWithVisibleFields"
         :style="{width: `${this.cellWidths[cellIdx]}%`}"
    >
      <span class="divider"
            v-if="cellIdx > 0"
            @mousedown="this.startDragging(cellIdx)"
      ></span>

      <dynamic-cell :cookie-field="cookieField"
                    :cell-idx="cellIdx"
                    :on-mouse-up="this.onMouseUp"
                    :on-blur="this.onBlur"
                    :on-select-change="this.onSelectChange"
                    :on-key="this.onKey"
      />
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import DynamicCell from "./DynamicCell";
import CellSaver from "../classes/CellSaver";
import SettingKeys from "../classes/SettingKeys";
import hash from 'object-hash';

export default {
  name: "Cookie",
  components: {DynamicCell},
  props: {
    cookieObject: Object,
    idx: Number,
    cellWidths: Array,
    startDragging: Function,
    onArrowNavigation: Function,
  },
  data() {
    return {
      skipSaveOnBlur: false,
      inputValueBeforeEditStarted: '',
    };
  },
  computed: {
    ...mapGetters(['hostsTree', 'selectedCookie', 'selectedCellIdx', 'headers', 'settings', 'filteredCookies']),
    cookieWithVisibleFields() {
      const cookie = {...this.cookieObject};
      delete cookie.session;

      for (const header of this.headers) {
        if (this.settings[SettingKeys.HIDDEN_HEADERS].indexOf(header.key) >= 0) {
          delete cookie[header.key];
        }
      }

      return cookie;
    },
    cookieHash() {
      return hash.sha1(this.cookieObject);
    },
    selectedCookieHash() {
      return hash.sha1(this.selectedCookie);
    },
  },
  methods: {
    onMouseUp(e, cellIdx) {
      this.$store.dispatch('setSelectedCellIdx', cellIdx);
      this.$store.dispatch('setSelectedCookie', this.cookieObject);

      this.inputValueBeforeEditStarted = e.target?.value;
    },
    async onBlur(e) {
      if (this.skipSaveOnBlur) {
        this.skipSaveOnBlur = false;
        e.target.value = this.inputValueBeforeEditStarted;
        return;
      }

      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.cookieObject, this.$store);
    },
    async onSelectChange(e) {
      await CellSaver.saveCellValue(e.target.dataset.key, e.target, this.cookieObject, this.$store);
    },
    async onKey(e) {
      if (e.code === 'Enter') {
        e.target.blur();
      } else if (e.code === 'Escape') {
        this.skipSaveOnBlur = true;
        e.target.blur();
      } else if (e.code === 'ArrowUp') {
        if (this.idx > 0) {
          //e.target.blur();
          this.onArrowNavigation(this.idx - 1);
        }
      } else if (e.code === 'ArrowDown') {
        if (this.idx < this.filteredCookies.length - 1) {
          ///e.target.blur();
          this.onArrowNavigation(this.idx + 1);
        }
      }
    },
  },
}
</script>

<style lang="less" scoped>
  span.divider {
    position: absolute;
    width: 8px;
    height: 100%;
    left: -4px;
    top: 0;
    cursor: ew-resize;
  }

  div.cookie {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid #ddd;
    background-color: white;

    &:nth-of-type(2n) {
      background-color: #f1f3f4;
    }

    &.focused {
      background-color: #b3d5fe;
    }

    div.cell {
      position: relative;
      border-right: 1px solid #ddd;
      box-sizing: border-box;
      display: flex;
      align-items: center;

      &:last-of-type {
        border-right: none;
      }
    }
  }
</style>