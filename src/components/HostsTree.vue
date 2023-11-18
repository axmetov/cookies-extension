<template>
  <div id="hosts-tree" :style="{width: `${width}%`}">
    <div id="settings">
      <div class="setting">
        <input type="checkbox" id="compact-tree" @change="onChangeCompactTree($event)" :checked="this.isCompactTree" />
        <label for="compact-tree" title="Hide empty and intermediate hosts">Compact Tree</label>
      </div>
    </div>
    <div id="tree">
      <div class="host"
           :class="{ selected: this.selectedDomain === leveldHost.domainName }"
           v-for="leveldHost in leveldHosts"
           :data-domain="leveldHost.domainName"
           @click="onHostClick"
      >
        <span class="host-level" v-for="idx in leveldHost.level" :key="`lvld-host-${idx}`">.</span>
        ({{ leveldHost.cookiesCount }})
        <strong>{{ prefixSubdomainWithAsterisk(leveldHost.domainName) }}</strong>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";
import SettingKeys from "../classes/SettingKeys";

export default {
  name: "HostsTree",
  props: {
    width: Number,
  },
  data() {
    return {
      isCompactTree: true,
    };
  },
  mounted() {
    this.isCompactTree = this.settings[SettingKeys.HOSTS_TREE_COMPACT_TREE];
  },
  methods: {
    hostsTreeToLeveldElement(hostsTree, resultArr = [], level = 1) {
      for (const domainName in hostsTree) {
        if (domainName === 'cookies') {
          if (Object.keys(hostsTree).length === 1) {
            return resultArr;
          }

          continue;
        }

        const cookiesOfDomain = hostsTree[domainName].cookies;

        if (!this.isCompactTree) {
          // with a full tree we just display everything
          resultArr.push({
            domainName,
            level,
            cookiesCount: cookiesOfDomain.length,
          });
        } else if (cookiesOfDomain.length > 0) {
          // in compact tree only hosts with cookie are displayed
          let isThereAnyDirectCookie = false;
          let directCookieCnt = 0;

          for (const cookie of cookiesOfDomain) {
            if (cookie.domain !== domainName) {
              continue;
            }

            isThereAnyDirectCookie = true;
            // we want to show only direct cookies count without child domains
            directCookieCnt += 1;
          }

          resultArr.push({
            domainName,
            level,
            cookiesCount: isThereAnyDirectCookie ? directCookieCnt : 0,
          });
        }

        resultArr = this.hostsTreeToLeveldElement(hostsTree[domainName], resultArr, level + 1);
      }

      return resultArr;
    },
    prefixSubdomainWithAsterisk(domainName) {
      return domainName.startsWith('.') ? `*${domainName}` : domainName;
    },
    onHostClick(e) {
      this.$store.dispatch('setSelectedDomain', e.currentTarget.dataset.domain);
    },
    onChangeCompactTree(e) {
      const checked = e.target.checked;
      this.$store.dispatch('updateSettings', { [SettingKeys.HOSTS_TREE_COMPACT_TREE]: checked });
      this.isCompactTree = checked;
    },
  },
  computed: {
    ...mapGetters(['hostsTree', 'selectedDomain', 'settings']),
    leveldHosts() {
      let leveld = this.hostsTreeToLeveldElement(this.hostsTree);

      leveld.unshift({
        domainName: 'all hosts',
        level: 0,
        cookiesCount: this.hostsTree.cookies.length,
      });

      if (this.isCompactTree) {
        leveld = leveld.filter(hostData => hostData.cookiesCount > 0);
      }

      return leveld;
    },
  },
}
</script>

<style lang="less" scoped>
  #hosts-tree {
    min-width: 100px;
    display: flex;
    flex-direction: column;

    #settings {
      width: 100%;
      padding: 7px 3px;
      box-sizing: border-box;
      background-color: #f1f3f4;
      border-bottom: 1px solid #ccc;

      div.setting {
        display: flex;
      }
    }

    #tree {
      overflow: auto;
      padding: 10px 0;
      box-sizing: border-box;
      user-select: none;
      height: 100%;

      div.host {
        display: block;
        text-overflow: clip;
        white-space: nowrap;
        color: #333;
        padding: 3px 10px;
        cursor: pointer;

        &:hover {
          background-color: rgba(0, 0, 0, .1);
        }

        &.selected {
          background-color: #b3d5fe;
          color: #000;
        }

        strong {
          font-weight: 500;
        }

        span.host-level {
          display: inline-block;
          width: 5px;
          margin-bottom: 0.5px;
          color: #aaa;

          &:last-of-type {
            //margin-right: 3px;
          }
        }
      }
    }
  }
</style>