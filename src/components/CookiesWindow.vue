<template>
  <div id="cookies-window"
       :style="{width: `${100 - width}%`}"
       :class="{ dividing: isDividing }"
  >
    <div id="panel" ref="panel">
      <div class="row">
        <div id="refresh-btn"
             class="btn"
             title="Refresh"
             @click="onRefresh"
        >🔄</div>
        <div id="filter">
          <input type="text" placeholder="Filter" @input="onFilter" />
        </div>
        <div id="delete-selected-btn"
             class="btn"
             title="Delete Selected"
             @click="onDelete"
             v-if="Object.keys(selectedCookie).length > 0"
        >🗑️</div>
      </div>
      <div class="row">
        <div id="columns-filter">
          <div v-for="header in headers">
            <label>
              <input type="checkbox"
                     :data-key="header.key"
                     :checked="isHeaderVisible(header.key)"
                     @change="() => onHeaderVisibilityChange(header.key)"
              />
              {{ header.name }}
            </label>
          </div>
        </div>
      </div>
    </div>
    <div id="right-wrapper" ref="rightWrapper">
      <data-table
          :data="this.tableData"
          :on-sorting-changed="this.onSortingChanged"
          :sorting-order="this.sortingOrder"
          :sorting-field="this.sortingField"
          :height="isCookieSelected ? dividerPosition : 100"
      />
      <div id="divider"
           v-if="isCookieSelected"
           :style="{top: `${dividerPosition}%`}"
           @mousedown="startDragging"
      ></div>
      <cookie-viewer v-if="isCookieSelected"
                     :height="dividerPosition"
      />
    </div>
  </div>
</template>

<script>
import DataTable from "./DataTable";
import {mapGetters} from "vuex";
import CookieConverter from "../classes/CookieConverter";
import CookieViewer from "./CookieViewer";
import SettingKeys from "../classes/SettingKeys";

export default {
  name: "CookiesWindow",
  components: {CookieViewer, DataTable},
  props: {
    width: Number,
  },
  data() {
    return {
      sortingField: '',
      sortingOrder: 'asc',
      dividerPosition: 0,
      isDividing: false,
    };
  },
  mounted() {
    document.addEventListener('mousemove', this.handleDragging);
    window.addEventListener('mouseup', this.endDragging);

    window.addEventListener('endDragging', this.setRightWrapperHeight);

    this.dividerPosition = this.settings[SettingKeys.COOKIE_VIEWER_DIVIDER_POSITION];

    this.setRightWrapperHeight();
  },
  computed: {
    ...mapGetters(['hostsTree', 'selectedDomain', 'selectedCookie', 'isCookieSelected', 'headers', 'settings', 'filteredCookies']),
    sortedFilteredCookies() {
      let cookies = [...this.filteredCookies];

      if (this.sortingOrder !== '' && this.sortingField !== '') {
        // sorting applied
        const sign = this.sortingOrder === 'asc' ? 1 : -1;
        return cookies.sort((cookieA, cookieB) => {
          if (this.sortingField === 'size') {
            // size number
            return (new Blob([cookieA.value]).size - new Blob([cookieB.value]).size) * sign;
          }

          // plain string
          return String(cookieA[this.sortingField])
              .localeCompare(
                  String(cookieB[this.sortingField])
              ) * sign;
        });
      }

      // no sorting applied, return as-is
      return cookies;
    },
    tableData() {
      return this.sortedFilteredCookies.map(cookie => CookieConverter.chromeCookieToObject(cookie));
    },
  },
  methods: {
    setRightWrapperHeight() {
      const panelHeight = this.$refs?.panel?.getBoundingClientRect()?.height ?? 65;
      if (this.$refs.rightWrapper) {
        this.$refs.rightWrapper.style.height = `calc(100% - ${panelHeight}px)`;
      }
    },
    isHeaderVisible(headerKey) {
      return this.settings[SettingKeys.HIDDEN_HEADERS].indexOf(headerKey) < 0;
    },
    onSortingChanged(columnKey) {
      if (this.sortingField !== columnKey) {
        // reset order
        this.sortingOrder = '';
      }

      const sortingOrders = ['asc', 'desc', ''];
      this.sortingField = columnKey;
      const currentSortingIndex = sortingOrders.indexOf(this.sortingOrder);
      this.sortingOrder = currentSortingIndex + 1 >= sortingOrders.length
          ? sortingOrders[0]
          : sortingOrders[currentSortingIndex + 1];
    },
    onRefresh() {
      this.$store.dispatch('loadCookiesFromChrome');
    },
    onDelete() {
      const chromeCookie = CookieConverter.objectToChromeCookie(this.selectedCookie)
      this.$store.dispatch('deleteCookie', {
        name: chromeCookie.name,
        url: chromeCookie.url
      });
    },
    onFilter(e) {
      this.$store.dispatch('setSelectedDomain', 'all hosts');
      this.$store.dispatch('setFilterValue', e.target.value);
    },
    onHeaderVisibilityChange(key) {
      let hiddenHeaders = [...this.settings[SettingKeys.HIDDEN_HEADERS]];
      if (hiddenHeaders.indexOf(key) >= 0) {
        // header was hidden before, make it visible again
        hiddenHeaders.splice(hiddenHeaders.indexOf(key), 1);
      } else {
        // header is visible, hide it
        hiddenHeaders.push(key);
      }

      const visibleColsCount = 9 - hiddenHeaders.length;

      this.$store.dispatch('updateSettings', {
        [SettingKeys.HIDDEN_HEADERS]: hiddenHeaders,
        [SettingKeys.HEADERS_WIDTHS]: Array(visibleColsCount).fill(100 / visibleColsCount), // refresh widths
      });
    },

    handleDragging (e) {
      if (!this.isDividing) {
        return;
      }

      const percentage = (
          (e.pageY - this.$refs.panel.getBoundingClientRect().height)
          / this.$refs.rightWrapper.getBoundingClientRect().height
      ) * 100;

      // limit also by a min height
      if (percentage >= 10 && e.pageY >= 100 && percentage <= 90) {
        this.dividerPosition = +percentage.toFixed(2)
      }
    },
    startDragging () {
      this.isDividing = true;
    },
    endDragging () {
      if (!this.isDividing) {
        return;
      }

      this.isDividing = false;
      this.$store.dispatch('updateSettings', { [SettingKeys.COOKIE_VIEWER_DIVIDER_POSITION]: this.dividerPosition });
    },
  },
  watch: {
    isCookieSelected(newValue, oldValue) {
      this.setRightWrapperHeight();
    }
  },
}
</script>

<style lang="less" scoped>
  #cookies-window {
    height: 100vh;
    overflow: hidden;
    position: relative;
    padding: 0;
    box-sizing: border-box;
    border-left: 1px solid #bbb;
    border-right: 5px solid #f1f3f4;

    &.dividing {
      user-select: none;
    }

    #right-wrapper {
      position: relative;
    }

    #panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 5px 10px;
      background-color: #f1f3f4;
      border-bottom: 1px solid #ccc;
      box-sizing: border-box;

      div.row {
        display: flex;

        .btn {
          width: 30px;
          font-size: 14px;
          text-align: center;
          cursor: pointer;
          user-select: none;

          &:hover {
            box-shadow: 0 0 1px black;
            background-color: rgba(255, 255, 255, .5);
          }

          &:active {
            box-shadow: 0 0 1px black inset;
            background-color: rgba(0, 0, 0, .1);
          }

          &#refresh-btn {
            margin-right: 5px;
          }

          &#delete-selected-btn {
            margin-left: 5px;
          }
        }

        div#columns-filter {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          list-style: none;
          padding: 0;
          margin: 10px 0 4px;

          div {
            padding-right: 5px;

            label {
              display: flex;
              justify-content: left;
            }
          }
        }
      }
    }

    #columns {
      display: flex;
      padding: 5px 10px;
      background-color: #f1f3f4;
      border-top: 1px solid #eee;
      box-sizing: border-box;
    }

    #divider {
      width: 100%;
      height: 7px;
      background: transparent;
      position: absolute;
      transform: translateY(-3px);
      left: 0;
      z-index: 1;
      cursor: n-resize;
    }
  }
</style>