export default class HostsTreeBuilder {
  static buildHostsTree(hostsList, cookies) {
    const { hostsVariants, hostsTree } = HostsTreeBuilder.#buildInitialTree(hostsList);
    HostsTreeBuilder.#fillHostsTreeWithCookies(hostsVariants, hostsTree, cookies);
    HostsTreeBuilder.#bubbleCookiesUp(hostsTree);

    return HostsTreeBuilder.#filterEmptyHosts(hostsTree);
  }

  static #buildInitialTree(hostsList) {
    const hostsVariants = [];
    const hostsTree = {
      cookies: [],
    };

    for (const fullHost of hostsList) {
      // split hostname into parts
      const split = fullHost.split('.');

      // build variants of the hostname from .abc.def.ghi.com to .ghi.com
      // length - 2 to exclude domain zone
      let prevSubHost = {};
      for (let i = split.length - 2; i >= 0; i--) {
        const hostname = split.slice(i).join('.');
        hostsVariants.push(hostname); // host
        hostsVariants.push(`.${hostname}`); // subhosts

        if (i === split.length - 2) {
          // only for top level and first sublevel
          const subHostName = `.${hostname}`;

          if (!hostsTree[hostname]) {
            hostsTree[hostname] = {
              [subHostName]: {
                cookies: [],
              },
              cookies: [],
            };
          }

          prevSubHost = hostsTree[hostname][subHostName];
        } else if (!prevSubHost[hostname]) {
          // further sublevels
          const subHostName = `.${hostname}`;
          prevSubHost[hostname] = {
            [subHostName]: {
              cookies: [],
            },
            cookies: [],
          };
          prevSubHost = prevSubHost[hostname][subHostName];
        }
      }
    }

    return {
      hostsVariants,
      hostsTree,
    };
  }

  static #fillHostsTreeWithCookies(hostsVariants, hostsTree, cookies) {
    /** @type object[] */
    const filteredCookies = cookies.filter((cookie) => hostsVariants.indexOf(cookie.domain) >= 0);
    for (const cookie of filteredCookies) {
      const split = cookie.domain.split('.');
      const augmentedSplit = [];

      for (let i = 0; i < split.length; i++) {
        const domainPart = split[i];
        augmentedSplit.push(domainPart);
        if (domainPart !== '' && i < split.length - 2) {
          // add empty elements to transform those later into domains with leading dot
          // like ['', 'example', '', 'com'] -> .example.com
          augmentedSplit.push('');
        }
      }

      let currentLevel = hostsTree;
      for (let i = augmentedSplit.length - 2; i >= 0; i--) {
        const hostname = augmentedSplit.slice(i).join('.').replace('..', '.');
        if (i === 0) {
          // the full hostname is there, add cookie to the tree
          currentLevel[hostname].cookies.push(cookie);
        } else {
          // one level deeper in the host tree
          currentLevel = currentLevel[hostname];
        }
      }
    }
  }

  static #bubbleCookiesUp(currentTree, level = 0) {
    const domains = Object.keys(currentTree);

    for (const domainName of Object.keys(currentTree)) {
      // leafs
      if (level > 0 && domains.length === 1) {
        return currentTree.cookies;
      }

      if (domainName === 'cookies') {
        continue;
      }

      const cookiesFromNestedLevel = HostsTreeBuilder.#bubbleCookiesUp(currentTree[domainName], level + 1);
      currentTree.cookies.push(...cookiesFromNestedLevel);
    }

    return currentTree.cookies;
  }

  static #filterEmptyHosts(hostsTree) {
    const filteredTree = {};

    for (const domainName of Object.keys(hostsTree)) {
      if (domainName === 'cookies') {
        filteredTree[domainName] = [...hostsTree[domainName]];
        continue;
      }

      if (hostsTree[domainName].cookies.length > 0) {
        filteredTree[domainName] = { ...hostsTree[domainName] };
      }
    }

    return filteredTree;
  }
}
