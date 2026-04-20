module.exports = [
  {
    header: 'Elasticsearch Labs',
    sourceType: 'static',
    posts: [
      {
        title: 'Elastic MCP server: Expose Agent Builder tools to any AI agent',
        url: 'https://www.elastic.co/search-labs/blog/elastic-mcp-server-agent-builder-tools',
        date: '2025-10-20',
      },
      {
        title:
          'Connecting Elastic Agents to Gemini Enterprise via A2A protocol',
        url: 'https://www.elastic.co/search-labs/blog/a2a-protocol-elastic-agent-builder-gemini-enterprise',
        date: '2025-10-09',
      },
      {
        title:
          'Using LLMs to build an Elastic connector fast: A Crawl4AI tutorial',
        url: 'https://www.elastic.co/search-labs/blog/elastic-connectors-crawl4ai-llms',
        date: '2025-08-25',
      },
      {
        title:
          'Connect Agents to Elasticsearch with Model Context Protocol (MCP)',
        url: 'https://www.elastic.co/search-labs/blog/model-context-protocol-elasticsearch',
        date: '2025-03-28',
      },
      {
        title:
          'How to use the Connector API to ingest data into Elasticsearch Serverless',
        url: 'https://www.elastic.co/search-labs/blog/elasticsearch-connector-apis-sync-data-to-serverless',
        date: '2024-05-27',
      },
      {
        title: 'How to create custom connectors for Elasticsearch',
        url: 'https://www.elastic.co/search-labs/blog/how-to-create-customized-connectors-for-elasticsearch',
        date: '2023-10-04',
      },
    ],
  },
  {
    header: 'Velomapa (Polish)',
    sourceType: 'static',
    posts: [
      {
        title: 'Bikepacking na Bałkanach',
        url: 'https://velomapa.pl/blog/bikepacking-na-balkanach',
        date: '2024-11-01',
      },
    ],
  },
  {
    header: 'Cycling Doppio',
    sourceType: 'sitemap',
    sitemapUrl: 'https://www.cyclingdoppio.com/sitemap.xml',
    urlFilter: '/en/blog/',
    excludeFilters: [
      '/blog/authors',
      '/blog/autorzy',
      '/blog/tags',
      '/blog/tagi',
    ],
  },
  {
    header: 'Cycling Doppio (Polish)',
    sourceType: 'sitemap',
    sitemapUrl: 'https://www.cyclingdoppio.com/sitemap.xml',
    urlFilter: '/blog/',
    excludeFilters: [
      '/blog/authors',
      '/blog/autorzy',
      '/blog/tags',
      '/blog/tagi',
    ],
  },
];
