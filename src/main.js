import './styles/main.less';

import { createApp } from 'vue';
import { createStore } from 'vuex';
import CookiesExtension from './components/CookiesExtension';
import HostsTreeBuilder from './classes/HostsTreeBuilder';
import SettingKeys from './classes/SettingKeys';

document.addEventListener('DOMContentLoaded', () => {
  const app = createApp(CookiesExtension);

  function filterUniqueHosts(resources) {
    const documentResources = resources.filter((resource) => resource.type === 'document');
    const documentHostsRaw = documentResources
      .map((resource) => {
        try {
          return (new URL(resource.url))?.hostname;
        } catch (error) {
          return null;
        }
      })
      .filter((host) => !!host && host !== 'null');

    return [...new Set(documentHostsRaw)].sort();
  }

  async function onResourcesLoaded(resources, store) {
    const uniqueHosts = filterUniqueHosts(resources);
    await store.commit('setUniqueHosts', { uniqueHosts });

    const allCookies = await chrome.cookies.getAll({});
    await store.dispatch('updateAllCookies', allCookies);
  }

  const store = createStore({
    state() {
      return {
        hostsTree: {
          cookies: [],
        },
        uniqueHosts: [],
        selectedDomain: 'all hosts',
        filterValue: '',
        selectedCellIdx: -1,
        selectedCookie: {},
        headers: [
          { name: 'Name', key: 'name' },
          { name: 'Value', key: 'value' },
          { name: 'Domain', key: 'domain' },
          { name: 'Path', key: 'path' },
          { name: 'Expires', key: 'expirationDate' },
          { name: 'Size', key: 'size' },
          { name: 'HttpOnly', key: 'httpOnly' },
          { name: 'Secure', key: 'secure' },
          { name: 'SameSite', key: 'sameSite' },
        ],
        settings: {},
      };
    },
    mutations: {
      setCookies(state, { cookies }) {
        state.cookies = [...cookies];
      },
      setUniqueHosts(state, { uniqueHosts }) {
        state.uniqueHosts = [...uniqueHosts];
      },
      setHostsTree(state, { hostsTree }) {
        state.hostsTree = { ...hostsTree };
      },
      setSelectedDomain(state, { selectedDomain }) {
        state.selectedDomain = selectedDomain;
      },
      setFilterValue(state, { filterValue }) {
        state.filterValue = filterValue;
      },
      setSelectedCellIdx(state, { selectedCellIdx }) {
        state.selectedCellIdx = selectedCellIdx;
      },
      setSelectedCookie(state, { selectedCookie }) {
        state.selectedCookie = selectedCookie;
      },
      updateSettings(state, newSettings) {
        state.settings = { ...state.settings, ...newSettings };
      },
    },
    actions: {
      loadCookiesFromChrome(context) {
        chrome.devtools.inspectedWindow.getResources(async (resources) => {
          await onResourcesLoaded(resources, context);
        });
      },
      updateAllCookies(context, cookies) {
        const hostsTree = HostsTreeBuilder.buildHostsTree(context.state.uniqueHosts, cookies);
        context.commit('setCookies', { cookies });
        context.commit('setHostsTree', { hostsTree });
      },
      updateCookie(context, { newCookie }) {
        const allCookies = [...context.state.cookies];
        let updated = false;

        for (let i = 0; i < allCookies.length; i++) {
          const stateCookie = allCookies[i];
          if (stateCookie.name === newCookie.name && stateCookie.domain === newCookie.domain) {
            allCookies[i] = newCookie;
            updated = true;
          }
        }

        if (!updated) {
          // name or domain of the cookie was changed, so it's the new one
          allCookies.push(newCookie);
        }

        context.dispatch('updateAllCookies', allCookies);
      },
      setUniqueHosts(context, uniqueHosts) {
        context.commit('setUniqueHosts', { uniqueHosts });
      },
      setSelectedDomain(context, selectedDomain) {
        context.commit('setSelectedDomain', { selectedDomain });
      },
      setFilterValue(context, filterValue) {
        context.commit('setFilterValue', { filterValue });
      },
      setSelectedCellIdx(context, selectedCellIdx) {
        context.commit('setSelectedCellIdx', { selectedCellIdx });
      },
      setSelectedCookie(context, selectedCookie) {
        context.commit('setSelectedCookie', { selectedCookie });
      },
      async deleteCookie(context, { name, url }) {
        await chrome.cookies.remove({ name, url });

        const cookiesWithoutRemoved = context.state.cookies.filter(
          (cookie) => cookie.name !== name || cookie.url !== url,
        );
        await context.dispatch('updateAllCookies', cookiesWithoutRemoved);
      },
      async deleteCookiesByUrl(context, { url }) {
        const toNotPrefixedUrl = url => url.startsWith('.') ? url.slice(1) : url;
        const notPrefixedUrl = toNotPrefixedUrl(url);

        const domainRegexp = new RegExp(`.*\\.${notPrefixedUrl.replace('.', '\\.')}$`);
        const cookiesToRemove = url === 'all hosts'
          ? [...context.state.hostsTree.cookies]
          : context.state.hostsTree.cookies.filter(
            cookie => cookie.domain === url || domainRegexp.test(cookie.domain)
          );

        const removePromises = [];
        for (const cookie of cookiesToRemove) {
          // try both schemes
          removePromises.push(chrome.cookies.remove({ name: cookie.name, url: `http://${toNotPrefixedUrl(cookie.domain)}` }));
          removePromises.push(chrome.cookies.remove({ name: cookie.name, url: `https://${toNotPrefixedUrl(cookie.domain)}` }));
        }

        await Promise.all(removePromises);
        await context.dispatch('loadCookiesFromChrome');
      },
      async updateSettings(context, newSettings) {
        const newSettingsCast = { ...newSettings };

        if (newSettingsCast?.[SettingKeys.HIDDEN_HEADERS]) {
          newSettingsCast[SettingKeys.HIDDEN_HEADERS] = Object.values(newSettingsCast[SettingKeys.HIDDEN_HEADERS]);
        }
        if (newSettingsCast?.[SettingKeys.HEADERS_WIDTHS]) {
          newSettingsCast[SettingKeys.HEADERS_WIDTHS] = Object.values(newSettingsCast[SettingKeys.HEADERS_WIDTHS]);
        }
        await context.commit('updateSettings', newSettingsCast);
        chrome.storage.sync.set({ settings: context.state.settings });
      },
    },
    getters: {
      hostsTree(state) {
        return state.hostsTree;
      },
      filteredCookies(state) {
        let { cookies } = state.hostsTree;

        if (state.selectedDomain !== 'all hosts') {
          cookies = cookies.filter((cookie) => cookie.domain.endsWith(state.selectedDomain));
        } else if (state.filterValue.trim() !== '') {
          cookies = cookies.filter((cookie) => {
            const lowerCaseInput = state.filterValue.toLowerCase().trim();
            return cookie.name.toLowerCase().indexOf(lowerCaseInput) >= 0
                || cookie.value.toLowerCase().indexOf(lowerCaseInput) >= 0
                || cookie.domain.toLowerCase().indexOf(lowerCaseInput) >= 0
                || cookie.path.toLowerCase().indexOf(lowerCaseInput) >= 0;
          });
        }

        return cookies;
      },
      selectedDomain(state) {
        return state.selectedDomain;
      },
      selectedCellIdx(state) {
        return state.selectedCellIdx;
      },
      selectedCookie(state) {
        return state.selectedCookie;
      },
      isCookieSelected(state) {
        return Object.keys(state.selectedCookie).length > 0;
      },
      headers(state) {
        return state.headers;
      },
      visibleHeaders(state) {
        return state.headers.filter((header) => state.settings[SettingKeys.HIDDEN_HEADERS].indexOf(header.key) < 0);
      },
      settings(state) {
        return state.settings;
      },
    },
  });
  app.use(store);
  app.mount('#cookies-extension');
});
