<template>
  <div id="data-table"
       :class="{'not-selectable': this.isDividing}"
       :style="{ height: `${this.height}%` }"
       ref="dataTable"
  >
    <div id="header">
      <div class="column"
           v-for="(header, idx) in visibleHeaders"
           @mouseup="() => this.onHeaderClick(header.key)"
           :style="{width: `${this.colWidths[idx]}%`}"
           :data-key="header.key"
           ref="columns"
      >
        <span class="divider" v-if="idx > 0" @mousedown="startDragging(idx)"></span>
        <span class="header-name" :title="header.name">{{ header.name }}</span>
        <span class="sorting-indicator" v-if="this.sortingOrder === 'asc' && this.sortingField === header.key">▲</span>
        <span class="sorting-indicator" v-else-if="this.sortingOrder === 'desc' && this.sortingField === header.key">▼</span>
        <span class="sorting-indicator disabled" v-else>▲▼</span>
      </div>
    </div>
    <div id="data">
      <cookie-row v-for="(cookieObject, idx) in data"
              :cookie-object="cookieObject"
              :idx="idx"
              :cell-widths="this.colWidths"
              :start-dragging="this.startDragging"
              :on-arrow-navigation="this.onArrowCookiesNavigation"
              ref="cookieRows"
      />
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import SettingKeys from "../classes/SettingKeys";
import hash from "object-hash";
import CookieRow from "./CookieRow";

export default {
  name: "DataTable",
  components: {CookieRow},
  props: {
    data: Array,
    onSortingChanged: Function,
    sortingOrder: String,
    sortingField: String,
    height: Number,
  },
  data() {
    return {
      isDividing: false,
      colWidths: [],
      currentDividerColIdx: 0,
      activeInputRow: -1,
      activeInputCol: -1,
    };
  },
  mounted() {
    document.addEventListener('mousemove', this.handleDragging);
    window.addEventListener('mouseup', this.endDragging);

    this.colWidths = this.settings[SettingKeys.HEADERS_WIDTHS];
  },
  computed: {
    ...mapGetters(['headers', 'visibleHeaders', 'settings', 'selectedCookie', 'selectedCell']),
  },
  methods: {
    handleDragging (e) {
      if (!this.isDividing) {
        return;
      }

      const leftBorderX = this.$refs.columns[0].getBoundingClientRect().left;
      const rightBorderX = this.$refs.columns[this.$refs.columns.length - 1].getBoundingClientRect().right;

      if (this.currentDividerColIdx === 0) {
        return;
      }

      const tableWidthPx = rightBorderX - leftBorderX;

      const prevColLeftBorderX = this.$refs.columns[this.currentDividerColIdx - 1].getBoundingClientRect().left;
      const currentColRightBorderX = this.$refs.columns[this.currentDividerColIdx].getBoundingClientRect().right;
      const cursorInTwoColsX = e.pageX - prevColLeftBorderX;
      const coefficient = cursorInTwoColsX / (currentColRightBorderX - prevColLeftBorderX);
      const widthsSumInPercent = this.colWidths[this.currentDividerColIdx - 1] + this.colWidths[this.currentDividerColIdx];
      const prevColNewWidthPercent = widthsSumInPercent * coefficient; // prev col follows the cursor
      const currentColNewWidthPercent = widthsSumInPercent - prevColNewWidthPercent;

      const currentColNewWidthPx = tableWidthPx * currentColNewWidthPercent / 100;
      const prevColNewWidthPx = tableWidthPx * prevColNewWidthPercent / 100;

      const minWidthPx = 50;
      if (currentColNewWidthPx <= minWidthPx || prevColNewWidthPx <= minWidthPx) {
        return;
      }

      this.colWidths[this.currentDividerColIdx - 1] = prevColNewWidthPercent;
      this.colWidths[this.currentDividerColIdx] = currentColNewWidthPercent;
    },
    startDragging (idx) {
      this.isDividing = true;
      this.currentDividerColIdx = idx;
    },
    endDragging () {
      if (!this.isDividing) {
        return;
      }

      this.isDividing = false;
      this.currentDividerColIdx = 0;
      this.$store.dispatch('updateSettings', { [SettingKeys.HEADERS_WIDTHS]: this.colWidths });
    },
    onHeaderClick(headerKey) {
      if (!this.isDividing) {
        this.onSortingChanged(headerKey);
      }
    },
    onArrowCookiesNavigation(newIdx) {
      this.$refs.cookieRows[newIdx].$refs.cookieRow.querySelectorAll('div.cell')[this.selectedCell.idx].querySelector(':not(.divider)').focus();
      this.$refs.cookieRows[newIdx].$refs.cookieRow.querySelectorAll('div.cell')[this.selectedCell.idx].querySelector(':not(.divider)').dispatchEvent(new Event('mouseup'));
    },
  },
  watch: {
    visibleHeaders(newVisibleHeaders, oldVisibleHeaders) {
      const newKeys = newVisibleHeaders.map(header => header.key);
      const oldKeys = oldVisibleHeaders.map(header => header.key);

      if (newKeys.length === oldKeys.length) {
        // no diff
        return;
      }

      const oneColWidth = 100 / newVisibleHeaders.length;
      this.colWidths = Array(newVisibleHeaders.length).fill(oneColWidth);
    },
    selectedCookie(newCookie, oldCookie) {
      // when cookie viewer appears, the data table becomes shorter, so we need to scroll, otherwise not
      if (Object.keys(newCookie).length === 0 || Object.keys(oldCookie).length > 0) {
        return;
      }

      const cookieHash = hash.sha1(newCookie);
      const targetRow = this.$refs.cookieRows.find(cookieRow => cookieRow.cookieHash === cookieHash);
      setTimeout(() => {
        targetRow.$refs.cookieRow.scrollIntoView({ behavior: "smooth" });
      }, 0);
    },
  },
}
</script>

<style lang="less" scoped>
  div#data-table {
    overflow-y: scroll;
    height: calc(100% - 65px);
    background-color: #fafafa;

    &.not-selectable {
      user-select: none;

      .column {
        background-color: unset!important;
      }
    }

    span.divider {
      position: absolute;
      width: 8px;
      height: 100%;
      left: -4px;
      top: 0;
      cursor: ew-resize;
    }

    #header {
      display: flex;
      width: 100%;
      background-color: #f1f3f4;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ccc;
      user-select: none;

      .column {
        box-sizing: border-box;
        width: 10%;
        padding: 3px 4px;
        border-right: 1px solid #ccc;
        cursor: pointer;
        position: relative;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;

        &:hover {
          background-color: rgba(0, 0, 0, .1);
        }

        &:active {
          background-color: rgba(0, 0, 0, .2);
        }

        &:last-of-type {
          border-right: none;
        }

        span.header-name {
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: calc(100% - 10px);
        }

        span.sorting-indicator {
          color: #555;
          font-size: .75em;
          min-width: 10px;
          text-align: right;

          &.disabled {
            color: #ccc;
          }
        }
      }
    }

    #data {
      height: calc(100% - 30px);
    }
  }
</style>