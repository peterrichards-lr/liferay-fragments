/**
 * Liferay Fragment Mocks (Test Bed Edition)
 * Simulates the environment variables and global objects injected by Liferay DXP.
 */

window.Liferay = window.Liferay || {};

// 1. Data Mock
window.Liferay.Data = {
  ICONS_INLINE_SVG: true,
  NAV_SELECTOR: "#navigation",
  NAV_SELECTOR_MOBILE: "#navigationCollapse",
  notices: [],
  NAV_INTERACTION_LIST_SELECTOR: ".navbar-site",
  NAV_LIST_SELECTOR: ".navbar-site",
};

// Theme ID Mapping
const themeIds = {
  classic: "classic",
  dialect: "liferay-dialect-theme",
  meridian: "liferay-meridian-theme",
};

// 2. ThemeDisplay Mock
window.Liferay.ThemeDisplay = {
  getLanguageId: () => "en_US",
  getScopeGroupId: () => "20120",
  getSiteGroupId: () => "20120",
  getUserId: () => "20121",
  getUserName: () => "Test User",
  isSignedIn: () => true,
  getPathThemeImages: () => `/o/${window.themeName || "meridian"}-theme/images`,
  getPathContext: () => "",
  getCDNBaseURL: () => "",
  getLayoutRelativeURL: () => "/",
  getLayoutURL: () => "http://localhost:8080/",
  getURLHome: () => "http://localhost:8080/",
  getThemeId: () => themeIds[window.themeName] || themeIds.meridian,
  getThemeName: () =>
    (window.themeName || "meridian").charAt(0).toUpperCase() +
    (window.themeName || "meridian").slice(1),
};

// 3. Icons Mock
window.Liferay.Icons = {
  spritemap: window.LiferayThemeSpritemap || "#",
};

// 4. Util Mock (Fetch & Identifiers)
window.Liferay.Util = {
  fetch: async (url, options) => {
    console.info(`[Mock Fetch] ${url}`);

    if (window.LiferayMockData) {
      if (window.LiferayMockData[url]) {
        return { ok: true, json: async () => window.LiferayMockData[url] };
      }

      for (const key in window.LiferayMockData) {
        if (url.includes(key)) {
          return { ok: true, json: async () => window.LiferayMockData[key] };
        }
      }
    }

    if (url.includes("/object-definitions/")) {
      const erc = url.split("/").pop();
      return {
        ok: true,
        json: async () => ({
          name: erc,
          label: erc.replace(/_/g, " "),
          pluralLabel: erc.replace(/_/g, " ") + "s",
          restContextPath: `/o/c/${erc.toLowerCase()}`,
          scope: "site",
          objectFields: [
            { name: "id", label: "ID", type: "Integer" },
            { name: "externalReferenceCode", label: "ERC", type: "String" },
            { name: "title", label: "Title", type: "String", localized: true },
            { name: "description", label: "Description", type: "String" },
            { name: "createDate", label: "Created", type: "Date" },
            { name: "status", label: "Status", type: "String" },
          ],
        }),
      };
    }

    if (url.includes("/o/c/")) {
      return {
        ok: true,
        json: async () => ({
          totalCount: 5,
          items: [
            {
              id: 1,
              externalReferenceCode: "ERC-001",
              title: { en_US: "Mock Record 1" },
              description: "Mock data from test-bed",
              createDate: new Date().toISOString(),
              status: { label: "Approved", code: 0 },
            },
            {
              id: 2,
              externalReferenceCode: "ERC-002",
              title: { en_US: "Mock Record 2" },
              description: "Mock data from test-bed",
              createDate: new Date().toISOString(),
              status: { label: "Pending", code: 1 },
            },
            {
              id: 3,
              externalReferenceCode: "ERC-003",
              title: { en_US: "Mock Record 3" },
              description: "Mock data from test-bed",
              createDate: new Date().toISOString(),
              status: { label: "Approved", code: 0 },
            },
            {
              id: 4,
              externalReferenceCode: "ERC-004",
              title: { en_US: "Mock Record 4" },
              description: "Mock data from test-bed",
              createDate: new Date().toISOString(),
              status: { label: "Approved", code: 0 },
            },
            {
              id: 5,
              externalReferenceCode: "ERC-005",
              title: { en_US: "Mock Record 5" },
              description: "Mock data from test-bed",
              createDate: new Date().toISOString(),
              status: { label: "Approved", code: 0 },
            },
          ],
        }),
      };
    }

    return { ok: false, status: 404 };
  },

  SessionStorage: {
    getItem: (key) => window.sessionStorage.getItem(key),
    setItem: (key, val) => window.sessionStorage.setItem(key, val),
    removeItem: (key) => window.sessionStorage.removeItem(key),
    TYPES: { PERSONALIZATION: "personalization" },
  },

  LocalStorage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, val) => window.localStorage.setItem(key, val),
    removeItem: (key) => window.localStorage.removeItem(key),
  },

  getAttributes: (el) => ({}),
};

// 5. Liferay Event System Mock
window.Liferay.on = (event, callback) => {
  if (event === "allPortletsReady" || event === "domReady") {
    setTimeout(() => {
      if (typeof callback === "function") {
        callback({
          details: [
            {
              portletId:
                "com_liferay_site_navigation_menu_web_portlet_SiteNavigationMenuPortlet",
            },
          ],
          type: "allPortletsReady",
        });
      }
    }, 100);
  }
};

window.Liferay.fire = (event, data) => {
  console.log(`[Liferay.fire] Event: ${event}`, data);
};

// 6. Commerce Mock
window.Liferay.CommerceContext = {
  getGroupId: () => "20120",
  getUserId: () => "20121",
  getAccountId: () => "20122",
  getChannelId: () => "20123",
};

// 7. OAuth2 Mock
window.Liferay.OAuth2Client = {
  fromUserAgent: (userAgentAppExtRefCode) => ({
    fetch: window.Liferay.Util.fetch,
  }),
};

// 8. Language Mock
window.Liferay.Language = {
  get: (key) => key,
};

// 9. Storage Mocks (Polyfill for restricted environments)
const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

if (typeof window.localStorage === "undefined") {
  window.localStorage = createStorageMock();
}
if (typeof window.sessionStorage === "undefined") {
  window.sessionStorage = createStorageMock();
}

// 10. Cookie Mock
let cookieStore = "";
Object.defineProperty(document, "cookie", {
  get: () => cookieStore,
  set: (val) => {
    cookieStore = val;
  },
});

// 11. Generic Input Mock
if (typeof window.input === "undefined") {
  window.input = {
    name: "test-input",
    value: "",
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => "",
    attributes: { readOnly: false },
  };
}

// 12. htmlUtil Mock (in case any JS uses it)
window.htmlUtil = {
  escape: (val) =>
    String(val).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    ),
};

window.Liferay.authToken = "zVAzKyJ2";
window.Liferay.currentURL = "/";
