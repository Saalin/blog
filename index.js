const fs = require('fs');
const sass = require('sass');
const fm = require('front-matter')
const ejs = require('ejs');
const yaml = require('js-yaml');

const { rimraf } = require('rimraf');
var minify = require('html-minifier').minify;
const { SitemapStream, streamToPromise } = require( 'sitemap' );
const { Readable } = require( 'stream' );

const parse = require('./src/parser').default;

(async () => {
  const pagesDir = "pages";
  const postsDir = "posts";
  const links = [];

  function compileCss() {
    const result = sass.compile("static/main.scss");
    fs.writeFileSync("build/main.css", result.css);
    fs.copyFileSync("static/prism.css", "build/prism.css");
    fs.copyFileSync("static/katex.min.css", "build/katex.min.css");
    fs.copyFileSync("static/robots.txt", "build/robots.txt");
    fs.copyFileSync("static/favicon.png", "build/favicon.png");
  }

  function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function getAllPosts() {
    const filesNames = fs.readdirSync(postsDir);
    const result = [];
    for(const filename of filesNames) {
      const input =  fs.readFileSync(`${postsDir}/${filename}`, 'utf-8');
      const data = fm(input);
      const meta = yaml.load(data.frontmatter);
      const outputName = filename.replace(".md", "");
      result.push({
        title: meta.title,
        rawDate: meta.date,
        date: Date.parse(meta.date),
        url: `/posts/${outputName}.html`,
        content: data.body,
      });
      links.push({ url: `/posts/${outputName}.html`,  changefreq: 'daily', priority: 0.9, lastmod: meta.date });
    }
    return result;
  }

  const posts = getAllPosts();

  function compilePages() {
    const filesNames = fs.readdirSync(pagesDir);
    const template = fs.readFileSync("templates/default.ejs", 'utf-8');

    for (const filename of filesNames) {
      const input =  fs.readFileSync(`${pagesDir}/${filename}`, 'utf-8');
      const content = parse(input);
      const outputName = filename.replace(".md", "");
      const title = capitalizeFirstLetter(outputName);
      const html = ejs.render(template, { content: content, title: title, comments: false });
      fs.writeFileSync(`build/${outputName}.html`, minify(html, { collapseWhitespace: true }));
      links.push({ url: `/${outputName}.html`,  changefreq: 'daily', priority: 0.5 });
    }
  }

  function compilePosts() {
    const template = fs.readFileSync("templates/default.ejs", 'utf-8');

    for (const post of posts) {
      const content = parse(post.content);
      const html = ejs.render(template, { content: content, title: post.title, comments: true });
      fs.writeFileSync(`build${post.url}`, minify(html, { collapseWhitespace: true }));
    }
  }

  function compileIndex() {
    const indexTemplate = fs.readFileSync("templates/default.ejs", 'utf-8');
    const postsTemplate = fs.readFileSync("templates/home.ejs", 'utf-8');
    const postsListHtml = ejs.render(postsTemplate, { posts: posts });
    const indexHtml = ejs.render(indexTemplate, { content: postsListHtml, title: 'Home', comments: false });

    fs.writeFileSync("build/index.html", minify(indexHtml, { collapseWhitespace: true }));
    links.push({ url: `/index.html`,  changefreq: 'daily', priority: 1 });
  }

  async function prepareBuildDir() {
    await rimraf("build");
    fs.mkdirSync("build", { recursive: true });
    fs.mkdirSync("build/posts", { recursive: true });
  }

  async function createSitemap() {
    const stream = new SitemapStream( { hostname: 'https://saalin.dev' } )
    const result = await streamToPromise(Readable.from(links).pipe(stream));
    const sitemap = result.toString();
    fs.writeFileSync("build/sitemap.xml", sitemap);
  }

  await prepareBuildDir();
  compileCss();
  compileIndex();
  compilePages();
  compilePosts();
  await createSitemap();
})();