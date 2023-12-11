<template>
  <div id="separable-wrapper"
       :class="{ dividing: isDividing }"
       v-if="!isLoading"
  >
    <hosts-tree
        :width="this.dividerPosition"
    />
    <div id="divider" :style="{left: `${dividerPosition}%`}" @mousedown="startDragging()"></div>
    <cookies-window
      :width="this.dividerPosition"
    />
  </div>
  <div id="loading-screen" v-else>Loading...</div>
</template>

<script>
import HostsTree from "./HostsTree";
import CookiesWindow from "./CookiesWindow";
import {mapGetters} from "vuex";
import SettingKeys from "../classes/SettingKeys";

export default {
  name: "CookiesExtension",
  components: {CookiesWindow, HostsTree},
  data() {
    return {
      isLoading: true,
      dividerPosition: 0,
      isDividing: false,
    };
  },
  async mounted() {
    chrome.runtime.onMessage.addListener(message => {
      if (message.panelShown) {
        this.$store.dispatch('loadCookiesFromChrome');
      }
    });

    // when the active tab is refreshed, reload cookies
    chrome.tabs.onUpdated.addListener(tabId => {
      chrome.tabs.query({ active:true }, tabs => {
        for (const tab of tabs) {
          if (tabId === tab.id) {
            this.$store.dispatch('loadCookiesFromChrome');
            break;
          }
        }
      });
    });

    // but sometimes resources of the page are loaded after the refresh is finished
    chrome.devtools.inspectedWindow.onResourceAdded.addListener(() => {
      this.$store.dispatch('loadCookiesFromChrome');
    });

    document.addEventListener('mousemove', this.handleDragging);
    window.addEventListener('mouseup', this.endDragging);
    document.addEventListener('click', this.handleClickDuringFocus);

    this.$store.dispatch('loadCookiesFromChrome');

    await chrome.storage.sync.get('settings')
        .then(async ({ settings }) => {

          const receivedSettings = {
            [SettingKeys.HIDDEN_HEADERS]: settings?.[SettingKeys.HIDDEN_HEADERS] ?? [],
            [SettingKeys.HEADERS_WIDTHS]: settings?.[SettingKeys.HEADERS_WIDTHS] ?? Array(9).fill(100 / 9),
            [SettingKeys.WINDOW_DIVIDER_POSITION]: settings?.[SettingKeys.WINDOW_DIVIDER_POSITION] ?? 25,
            [SettingKeys.COOKIE_VIEWER_DIVIDER_POSITION]: settings?.[SettingKeys.COOKIE_VIEWER_DIVIDER_POSITION] ?? 50,
            [SettingKeys.HOSTS_TREE_COMPACT_TREE]: settings?.[SettingKeys.HOSTS_TREE_COMPACT_TREE] ?? true,
          };

          await this.$store.dispatch('updateSettings', receivedSettings);
        });

    this.dividerPosition = this.settings[SettingKeys.WINDOW_DIVIDER_POSITION];

    this.isLoading = false;
  },
  computed: {
    ...mapGetters(['hostsTree', 'isCookieSelected', 'settings']),
  },
  methods: {
    handleDragging (e) {
      if (!this.isDividing) {
        return;
      }

      const percentage = (e.pageX / window.innerWidth) * 100

      // limit also by a min width of the hosts tree
      if (percentage >= 10 && e.pageX >= 100 && percentage <= 90) {
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
      this.$store.dispatch('updateSettings', { [SettingKeys.WINDOW_DIVIDER_POSITION]: this.dividerPosition });

      window.dispatchEvent(new CustomEvent('endDragging'))
    },
    handleClickDuringFocus(e) {
      if (!this.isCookieSelected) {
        // no focus atm
        return;
      }

      if (!e.target.closest('div#hosts-tree') && !e.target.closest('div#panel')) {
        // click in a valid area
        return;
      }

      // clicked during focus outside the valid area, do unfocus
      this.$store.dispatch('setSelectedCell', { idx: -1, key: '' });

      // dirty hack to have selected cookie for removal
      // when user clicks on Delete Selected
      setTimeout(() => this.$store.dispatch('setSelectedCookie', {}), 100);
    },
  },
}
</script>

<style lang="less" scoped>
  #separable-wrapper {
    display: flex;
    position: relative;
    height: 100vh;

    &.dividing {
      user-select: none;
    }

    #divider {
      height: 100%;
      width: 7px;
      background: transparent;
      position: absolute;
      transform: translateX(-3px);
      top: 0;
      z-index: 1;
      cursor: ew-resize;
    }
  }
</style>