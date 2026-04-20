const _ = require('lodash');
const Promise = require('bluebird');
const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
var exifr = require('exifr');
const readingTime = require('reading-time');

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  return new Promise((resolve, reject) => {
    const techBlogPost = path.resolve('src/templates/tech-blog-post.js');

    createPage({
      path: '/',
      component: path.resolve('src/pages/about.js'),
    });

    createPage({
      path: '/tech-blog/',
      component: path.resolve('src/templates/tech-blog-index.js'),
    });

    // tech-blog posts
    resolve(
      graphql(`
        {
          allMdx(
            sort: { frontmatter: { date: DESC } }
            filter: { fields: { category: { eq: "tech-blog" } } }
            limit: 1000
          ) {
            edges {
              node {
                fields {
                  slug
                  category
                }
                frontmatter {
                  title
                }
                internal {
                  contentFilePath
                }
              }
            }
          }
        }
      `).then((result) => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
          return;
        }

        // Create blog posts pages.
        const posts = result.data.allMdx.edges;
        _.reduce(
          posts,
          (result, post) => {
            result.add(post.node.fields.slug);
            return result;
          },
          new Set()
        );

        _.each(posts, (post, index) => {
          const previous =
            index === posts.length - 1 ? null : posts[index + 1].node;
          const next = index === 0 ? null : posts[index - 1].node;

          const nodePath = `${post.node.fields.category}${post.node.fields.slug}`;

          createPage({
            path: nodePath,
            component: `${techBlogPost}?__contentFilePath=${post.node.internal.contentFilePath}`,
            context: {
              slug: post.node.fields.slug,
              previous,
              next,
            },
          });
        });
      })
    );
  });
};

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (_.get(node, 'internal.type') === `Mdx`) {
    createNodeField({
      node,
      name: `timeToRead`,
      value: readingTime(node.body),
    });
    createNodeField({
      node,
      name: `slug`,
      value: createFilePath({ node, getNode, basePath: `blog` }),
    });
    createNodeField({
      node,
      name: `category`,
      value: path.basename(
        path.dirname(path.dirname(_.get(node, 'internal.contentFilePath')))
      ),
    });
  }
  if (node.internal.type === 'ImageSharp') {
    const parent = getNode(node.parent);
    exifr
      .parse(parent.absolutePath, [
        'Make',
        'Model',
        'ExposureTime',
        'FNumber',
        'FocalLength',
        'ISO',
        'LensMake',
        'LensModel',
      ])
      .then((exifData) => {
        createNodeField({
          node,
          name: 'exif',
          value: exifData && {
            ...exifData,
            ExposureTimeFormatted: formatExposureTime(exifData.ExposureTime),
            FocalLengthRounded: roundFocalLength(exifData.FocalLength),
          },
        });
      });
  }
};

// Helper to fetch and parse HTML content for metadata
const fetchPageMetadata = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch page ${url}: ${response.statusText}`);
      return null;
    }
    const html = await response.text();

    // Simple regex to extract title (matches content in <title> tag)
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    let title = titleMatch ? titleMatch[1].trim() : '';

    // Clean up title (common pattern: "Title | Site Name")
    if (title.includes('|')) {
      title = title.split('|')[0].trim();
    } else if (title.includes(' - ')) {
      title = title.split(' - ')[0].trim();
    }

    // Attempt to extract published date from meta tags
    // Matches <meta property="article:published_time" content="..."> or similar
    const dateMatch =
      /<meta\s+(?:property|name)=["'](?:article:published_time|date|pubdate)["']\s+content=["']([^"']+)["']/i.exec(
        html
      );
    let date = dateMatch ? dateMatch[1].split('T')[0] : null;

    // Fallback: try to find date in structured data (schema.org)
    if (!date) {
      const schemaMatch = /"datePublished":\s*"([^"]+)"/.exec(html);
      if (schemaMatch) {
        date = schemaMatch[1].split('T')[0];
      }
    }

    return { title, date };
  } catch (error) {
    console.warn(`Error extracting metadata for ${url}:`, error);
    return null;
  }
};

// Helper to parse XML sitemap using regex
const parseSitemap = async (url, filter, excludeFilters = []) => {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    const xml = await response.text();

    const posts = [];
    // Simple regex to match url blocks
    const urlRegex = /<url>(.*?)<\/url>/gs;
    const locRegex = /<loc>(.*?)<\/loc>/;
    const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/;

    let match;
    while ((match = urlRegex.exec(xml)) !== null) {
      const content = match[1];
      const locMatch = locRegex.exec(content);
      const lastmodMatch = lastmodRegex.exec(content);

      if (locMatch) {
        const postUrl = locMatch[1].trim();

        // Apply filter if provided
        if (filter && !postUrl.includes(filter)) {
          continue;
        }

        // Apply exclusion filters if provided
        if (excludeFilters.some((excl) => postUrl.includes(excl))) {
          continue;
        }

        // Extract default data from sitemap
        const slug = postUrl.split('/').filter(Boolean).pop();
        let title = slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        let date = lastmodMatch
          ? lastmodMatch[1].split('T')[0]
          : new Date().toISOString().split('T')[0];

        // Enhance with actual page metadata if available
        // We'll limit this to avoid hammering the server too hard sequentially,
        // but for a build process it's usually acceptable.
        console.log(`Fetching metadata for: ${postUrl}`);
        const metadata = await fetchPageMetadata(postUrl);

        if (metadata) {
          if (metadata.title) title = metadata.title;
          // Only override date if we found a specific publish date,
          // otherwise sitemap lastmod is often more reliable for "last updated"
          if (metadata.date) date = metadata.date;
        }

        posts.push({
          title,
          url: postUrl,
          date,
        });
      }
    }
    return posts;
  } catch (error) {
    console.error('Error parsing sitemap:', error);
    return [];
  }
};

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  const { createNode } = actions;
  const externalPostsConfig = require('./src/data/external-posts-config.js');

  for (const section of externalPostsConfig) {
    let posts = [];

    if (section.sourceType === 'static') {
      posts = section.posts || [];
    } else if (section.sourceType === 'sitemap' && section.sitemapUrl) {
      console.log(`Fetching sitemap for ${section.header}...`);
      const sitemapPosts = await parseSitemap(
        section.sitemapUrl,
        section.urlFilter,
        section.excludeFilters
      );
      posts = [...(section.posts || []), ...sitemapPosts];
    }

    for (const post of posts) {
      createNode({
        ...post,
        section: section.header,
        id: createNodeId(`external-post-${post.url}`),
        parent: null,
        children: [],
        internal: {
          type: 'ExternalPost',
          contentDigest: createContentDigest(post),
        },
      });
    }
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type ExternalPost implements Node {
      title: String!
      url: String!
      date: Date @dateformat
      section: String!
    }
  `;
  createTypes(typeDefs);
};

const roundFocalLength = (l) => {
  return Math.round(l);
};

const formatExposureTime = (d) => {
  if (d >= 1) {
    return Math.round(d * 10) / 10 + 's'; // round to one decimal if value > 1s by multiplying it by 10, rounding, then dividing by 10 again
  }
  var df = 1,
    top = 1,
    bot = 1;
  var tol = 1e-8;
  // iterate while value not reached and difference (positive or negative, hence the Math.abs) between value
  // and approximated value greater than given tolerance
  while (df !== d && Math.abs(df - d) > tol) {
    if (df < d) {
      top += 1;
    } else {
      bot += 1;
      top = parseInt(d * bot, 10);
    }
    df = top / bot;
  }
  if (top > 1) {
    bot = Math.round(bot / top);
    top = 1;
  }
  if (bot <= 1) {
    return '1s';
  }
  return top + '/' + bot + 's';
};
