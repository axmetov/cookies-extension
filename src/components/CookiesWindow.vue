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
        >
          <svg height="20" viewBox="0 -960 960 960" width="20">
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/>
          </svg>
        </div>
        <div id="filter">
          <input type="text" placeholder="Filter" @input="onFilter" ref="filterInput" />
          <span id="clear-filter-btn" title="Clear filter" @click="onClearFilterClick">×</span>
        </div>
        <div id="delete-all-btn"
             class="btn"
             :class="{ disabled: !this.isThereAnyCookie }"
             title="Delete All for the Selected Host"
             @click="onDeleteAll"
        >
          <svg height="24" viewBox="0 -960 960 960" width="24">
            <path d="M600-240v-80h160v80H600Zm0-320v-80h280v80H600Zm0 160v-80h240v80H600ZM120-640H80v-80h160v-60h160v60h160v80h-40v360q0 33-23.5 56.5T440-200H200q-33 0-56.5-23.5T120-280v-360Zm80 0v360h240v-360H200Zm0 0v360-360Z"/>
          </svg>
        </div>
        <div id="delete-selected-btn"
             class="btn"
             :class="{ disabled: !this.isCookieSelected }"
             title="Delete Selected"
             @click="onDelete"
        >
          <svg height="20" viewBox="0 -960 960 960" width="20">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
          </svg>
        </div>
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
      isCompactTree: false,
    };
  },
  mounted() {
    document.addEventListener('mousemove', this.handleDragging);
    window.addEventListener('mouseup', this.endDragging);

    window.addEventListener('endDragging', this.setRightWrapperHeight);

    this.dividerPosition = this.settings[SettingKeys.COOKIE_VIEWER_DIVIDER_POSITION];
    this.isCompactTree = this.settings[SettingKeys.HOSTS_TREE_COMPACT_TREE];

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
      let cookies = this.sortedFilteredCookies.map(cookie => CookieConverter.chromeCookieToObject(cookie));

      // remove non-direct cookies for host
      if (this.isCompactTree) {
        cookies = cookies.filter(
            cookie => cookie.domain.value === this.selectedDomain || this.selectedDomain === 'all hosts'
        );
      }

      return cookies;
    },
    isCookieSelected() {
      return Object.keys(this.selectedCookie).length > 0;
    },
    isThereAnyCookie() {
      return this.filteredCookies.length > 0;
    }
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
    onDeleteAll() {
      if (!this.isThereAnyCookie) {
        return;
      }

      this.$store.dispatch('deleteCookiesByUrl', {
        url: this.selectedDomain,
      });

    },
    onDelete() {
      if (!this.isCookieSelected) {
        return;
      }

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
    onClearFilterClick() {
      this.$refs.filterInput.value = '';
      this.$store.dispatch('setFilterValue', '');
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
    },
    settings(newSettings, oldSettings) {
      if (newSettings[SettingKeys.HOSTS_TREE_COMPACT_TREE] !== oldSettings[SettingKeys.HOSTS_TREE_COMPACT_TREE]) {
        this.isCompactTree = newSettings[SettingKeys.HOSTS_TREE_COMPACT_TREE];
      }
    },
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

        #filter {
          margin-right: 5px;
          position: relative;

          input {
            font-size: 14px;
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 3px;
          }

          span#clear-filter-btn {
            position: absolute;
            right: 5px;
            font-size: 19px;
            line-height: 19px;
            color: #757575;
            cursor: pointer;

            &:hover {
              color: #aaa;
            }

            &:active {
              color: #333;
            }
          }
        }

        .btn {
          width: 30px;
          height: 24px;
          user-select: none;
          border-radius: 3px;
          display: flex;
          justify-content: center;
          align-items: center;

          &:not(.disabled) { // active button
            cursor: pointer;

            &:hover {
              background-color: rgba(255, 255, 255, .7);
            }

            &:active {
              background-color: rgba(0, 0, 0, .1);
            }

            &#delete-selected-btn {
              path {
                fill: #de0000;
              }
            }
          }

          &#refresh-btn {
            margin-right: 5px;
            font-size: 18px;
            line-height: 19px;

            path {
              fill: #555;
            }
          }

          &#delete-selected-btn {
            margin-left: 5px;

            path {
              fill: #aaa;
            }
          }

          &#delete-all-btn {
            position: relative;

            path {
              fill: #de0000;
            }
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