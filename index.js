const fs = require('fs');
const sass = require('sass');
const fm = require('front-matter')
const ejs = require('ejs');
const yaml = require('js-yaml');
const _ = require('lodash');

const { rimraf } = require('rimraf');
var minify = require('html-minifier').minify;
const { SitemapStream, streamToPromise } = require( 'sitemap' );
const { Readable } = require( 'stream' );

const parse = require('./src/parser').default;

(async () => {
  function compileCss() {
    const result = sass.compile("static/main.scss");
    fs.writeFileSync("build/main.css", result.css);
    fs.copyFileSync("static/prism.css", "build/prism.css");
    fs.copyFileSync("static/katex.min.css", "build/katex.min.css");
    fs.copyFileSync("static/robots.txt", "build/robots.txt");
    fs.copyFileSync("static/favicon.png", "build/favicon.png");
  }

  function extract(inputDir, prefix) {
    const filesNames = fs.readdirSync(inputDir);
    const result = [];
    for(const filename of filesNames) {
      const input =  fs.readFileSync(`${inputDir}/${filename}`, 'utf-8');
      const data = fm(input);
      const meta = yaml.load(data.frontmatter);
      const outputName = filename.replace(".md", "");
      result.push({
        title: meta.title,
        rawDate: meta.date,
        date: Date.parse(meta.date),
        url: `${prefix}/${outputName}.html`,
        content: data.body,
        tags: meta.tags
      });
    }
    return result;
  }

  const posts = _.orderBy(extract("posts", "/posts"), ['date'], ['desc']); ;
  const allTags = _.uniq(_.flatMap(posts.map(x => x.tags), x => x));
  const pages = extract("pages", "");
  const contentTemplate = fs.readFileSync("templates/default.ejs", 'utf-8');

  function compilePages() {
    for (const page of pages) {
      const content = parse(page.content);
      const html = ejs.render(contentTemplate, { content: content, title: page.title, comments: false, tags: [] });
      fs.writeFileSync(`build${page.url}`, minify(html, { collapseWhitespace: true }));
    }
  }

  function compilePosts() {
    for (const post of posts) {
      const content = parse(post.content);
      const html = ejs.render(contentTemplate, { content: content, title: post.title, comments: true, tags: post.tags });
      fs.writeFileSync(`build${post.url}`, minify(html, { collapseWhitespace: true }));
    }
  }

  function compileIndex(list, fileName, title) {
    const postsTemplate = fs.readFileSync("templates/home.ejs", 'utf-8');
    const postsListHtml = ejs.render(postsTemplate, { posts: list, title: title });
    const indexHtml = ejs.render(contentTemplate, { content: postsListHtml, title: title, comments: false, tags: [] });

    fs.writeFileSync(`build/${fileName}.html`, minify(indexHtml, { collapseWhitespace: true }));
  }

  function compileTags() {
    const t = [];
    for(const tag of allTags) {
        const taggedPosts = posts.filter(x => _.includes(x.tags, tag));
        t.push({ name: tag, count: taggedPosts.length });
        compileIndex(taggedPosts, `tags/${tag}`, `Tag: ${tag}`);
    }
    const tagsTemplate = fs.readFileSync("templates/tags.ejs", 'utf-8');
    const tagsHtml = ejs.render(tagsTemplate, { title: 'Tags', tags: _.orderBy(t, ['name'], ['asc']) });
    fs.writeFileSync(`build/tags/index.html`, minify(tagsHtml, { collapseWhitespace: true }));
  }

  async function prepareBuildDir() {
    await rimraf("build");
    fs.mkdirSync("build", { recursive: true });
    fs.mkdirSync("build/posts", { recursive: true });
    fs.mkdirSync("build/tags", { recursive: true });
  }

  async function createSitemap() {
    const links = [{ url: `/index.html`, changefreq: 'daily', priority: 1 },
      { url: `/tags/index.html`, changefreq: 'daily', priority: 1 },
      ...(posts.map(x => ({ url: x.url, changefreq: 'daily', priority: 0.9  }))),
      ...(pages.map(x => ({ url: x.url, changefreq: 'daily', priority: 0.8  }))),
      ...(allTags.map(x => ({ url: `/tags/${x}.html`, changefreq: 'daily', priority: 0.5 }))),
    ];
    const stream = new SitemapStream( { hostname: 'https://saalin.dev' } )
    const result = await streamToPromise(Readable.from(links).pipe(stream));
    const sitemap = result.toString();
    fs.writeFileSync("build/sitemap.xml", sitemap);
  }

  await prepareBuildDir();
  compileCss();
  compileIndex(posts, 'index', 'Home');
  compilePages();
  compilePosts();
  compileTags();
  await createSitemap();
})();