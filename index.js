const fs = require('fs');
const { marked } = require('marked');
const sass = require('sass');
const fm = require('front-matter')
const ejs = require('ejs');
const yaml = require('js-yaml');
const katex = require('katex');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const { rimraf } = require('rimraf');
var minify = require('html-minifier').minify;

(async () => {
  const pagesDir = "pages";
  const postsDir = "posts";

  const renderer = new marked.Renderer()
  const rendererCode = renderer.code;
  loadLanguages(['javascript', 'csharp', 'jsx', 'css', 'markup', 'bash', 'json']);
  renderer.code = function (code, lang, escaped) {
    if (prism.languages[lang]) {
      return prism.highlight(code, prism.languages[lang], lang);
    } else {
      return rendererCode(code, lang, escaped);
    }
  }

  const originParagraph = renderer.paragraph.bind(renderer)
  renderer.paragraph = (text) => {
    const blockRegex = /\$\$[^\$]*\$\$/g
    const inlineRegex = /\$[^\$]*\$/g
    const blockExprArray = text.match(blockRegex)
    const inlineExprArray = text.match(inlineRegex)
    for (const i in blockExprArray) {
      const expr = blockExprArray[i]
      const result = renderMathsExpression(expr)
      text = text.replace(expr, result)
    }
    for (const i in inlineExprArray) {
      const expr = inlineExprArray[i]
      const result = renderMathsExpression(expr)
      text = text.replace(expr, result)
    }
    return originParagraph(text)
  }

  function renderMathsExpression(expr) {
    if (expr[0] === '$' && expr[expr.length - 1] === '$') {
      let displayStyle = false
      expr = expr.substr(1, expr.length - 2)
      if (expr[0] === '$' && expr[expr.length - 1] === '$') {
        displayStyle = true
        expr = expr.substr(1, expr.length - 2)
      }
      let html = null
      try {
        html = katex.renderToString(expr)
      } catch (e) {
        console.err(e)
      }
      if (displayStyle && html) {
        html = html.replace(/class="katex"/g, 'class="katex katex-block" style="display: block;"')
      }
      return html
    } else {
      return null
    }
  }
  marked.setOptions({ renderer: renderer })

  function compileCss() {
    const result = sass.compile("static/main.scss");
    fs.writeFileSync("build/main.css", result.css);
    fs.copyFile("static/prism.css", "build/prism.css", (err) => { });
    fs.copyFile("static/prism.js", "build/prism.js", (err) => { });
    fs.copyFile("static/katex.min.css", "build/katex.min.css", (err) => { });
    fs.copyFile("static/robots.txt", "build/robots.txt", (err) => { });
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
      })
    }
    return result;
  }

  const posts = getAllPosts();

  function compilePages() {
    const filesNames = fs.readdirSync(pagesDir);
    const template = fs.readFileSync("templates/default.ejs", 'utf-8');

    for (const filename of filesNames) {
      const input =  fs.readFileSync(`${pagesDir}/${filename}`, 'utf-8');
      const content = marked.parse(input);
      const outputName = filename.replace(".md", "");
      const title = capitalizeFirstLetter(outputName);
      const html = ejs.render(template, { content: content, title: title });
      fs.writeFileSync(`build/${outputName}.html`, minify(html, { collapseWhitespace: true }));
    }
  }

  function doesDirectoryExist(directoryPath) {
    try {
      // Check if the directory exists
      return fs.statSync(directoryPath).isDirectory();
    } catch (error) {
      // Handle the error if the directory doesn't exist
      if (error.code === 'ENOENT') {
        return false;
      } else {
        // Handle other errors
        throw error;
      }
    }
  }

  function compilePosts() {
    const template = fs.readFileSync("templates/default.ejs", 'utf-8');

    for (const post of posts) {
      const content = marked.parse(post.content);
      const html = ejs.render(template, { content: content, title: post.title });
      fs.writeFileSync(`build${post.url}`, minify(html, { collapseWhitespace: true }));
    }
  }

  function compileIndex() {
    const indexTemplate = fs.readFileSync("templates/default.ejs", 'utf-8');
    const postsTemplate = fs.readFileSync("templates/home.ejs", 'utf-8');
    const postsListHtml = ejs.render(postsTemplate, { posts: posts });
    const indexHtml = ejs.render(indexTemplate, { content: postsListHtml, title: 'Home' });

    fs.writeFileSync("build/index.html", minify(indexHtml, { collapseWhitespace: true }));
  }

  async function prepareBuildDir() {
    await rimraf("build");
    fs.mkdirSync("build", { recursive: true }, (err) => { console.log(err); });
    fs.mkdirSync("build/posts", { recursive: true }, (err) => { console.log(err); });
  }

  await prepareBuildDir();
  compileCss();
  compileIndex();
  compilePages();
  compilePosts();
})();