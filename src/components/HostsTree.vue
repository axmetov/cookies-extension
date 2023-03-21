<template>
  <div id="hosts-tree" :style="{width: `${width}%`}">
    <div class="host"
         :class="{ selected: this.selectedDomain === leveldHost.domainName }"
         v-for="leveldHost in leveldHosts"
         :data-domain="leveldHost.domainName"
         @click="onHostClick"
    >
      <span class="host-level" v-for="idx in leveldHost.level" :key="`lvld-host-${idx}`">⋅</span>
      {{ leveldHost.domainName }}
      ({{ leveldHost.cookiesCount }})
    </div>
  </div>
</template>

<script>
import {mapGetters} from "vuex";

export default {
  name: "HostsTree",
  props: {
    width: Number,
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

        resultArr.push({
          domainName,
          level,
          cookiesCount: hostsTree[domainName].cookies.length,
        });
        resultArr = this.hostsTreeToLeveldElement(hostsTree[domainName], resultArr, level + 1);
      }

      return resultArr;
    },
    onHostClick(e) {
      this.$store.dispatch('setSelectedDomain', e.currentTarget.dataset.domain);
    }
  },
  computed: {
    ...mapGetters(['hostsTree', 'selectedDomain']),
    leveldHosts() {
      let leveld = this.hostsTreeToLeveldElement(this.hostsTree);
      leveld.unshift({
        domainName: 'all hosts',
        level: 0,
        cookiesCount: this.hostsTree.cookies.length,
      });

      return leveld;
    },
  },
}
</script>

<style lang="less" scoped>
  #hosts-tree {
    min-width: 100px;
    overflow: auto;
    padding: 10px 0;
    box-sizing: border-box;
    user-select: none;

    div.host {
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

      span.host-level {
        display: inline-block;
        width: 6px;
        margin-bottom: 0.5px;
      }
    }
  }
</style>