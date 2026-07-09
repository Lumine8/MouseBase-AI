export default {
  title: "MouseBase",
  description: "Semantic memory for AI applications",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/introduction" },
      { text: "API", link: "/guide/authentication" },
      { text: "Python SDK", link: "/guide/python-sdk" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Quickstart", link: "/guide/quickstart" },
          { text: "Authentication", link: "/guide/authentication" },
        ],
      },
      {
        text: "API",
        items: [
          { text: "Remember", link: "/guide/remember" },
          { text: "Search", link: "/guide/search" },
          { text: "Projects", link: "/guide/projects" },
        ],
      },
      {
        text: "SDK",
        items: [
          { text: "Python SDK", link: "/guide/python-sdk" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Errors", link: "/guide/errors" },
          { text: "FAQ", link: "/guide/faq" },
        ],
      },
    ],
  },
};
