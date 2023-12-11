const fs = require('fs');
const { marked } = require('marked');
const sass = require('sass');
const fm = require('front-matter')
const ejs = require('ejs');
const yaml = require('js-yaml');
const katex = require('katex');
const prism = require('prismjs');
const { rimraf } = require('rimraf');

(async () => {
  const pagesDir = "pages";
  const postsDir = "posts";

  const renderer = new marked.Renderer();

  function mathsExpression(expr) {
    if (expr.match(/^\$\$[\s\S]*\$\$$/)) {
      expr = expr.substr(2, expr.length - 4);
      return katex.renderToString(expr, { displayMode: true });
    } else if (expr.match(/^\$[\s\S]*\$$/)) {
      expr = expr.substr(1, expr.length - 2);
      var r = katex.renderToString(expr, { isplayMode: false });
      return r;
    }
  }

  let loadLanguages = require('prismjs/components/');

  loadLanguages(['javascript', 'csharp', 'jsx', 'css', 'markup', 'bash', 'json']);

  const rendererCode = renderer.code;
  renderer.code = function (code, lang, escaped) {
    if (!lang) {
      const math = mathsExpression(code);
      if (math) {
        return math;
      }
    } else {
      if (prism.languages[lang]) {
        return prism.highlight(code, prism.languages[lang], lang);
      } else {
        return rendererCode(code, lang, escaped);
      }
    }

    return rendererCode(code, lang, escaped);
  };

  const rendererCodespan = renderer.codespan;
  renderer.codespan = function (text) {
    const math = mathsExpression(text);

    if (math) {
      return math;
    }

    return rendererCodespan(text);
  };

  marked.use({ renderer });

  function compileCss() {
    const result = sass.compile("static/main.scss");
    fs.writeFileSync("build/main.css", result.css);
    fs.copyFile("static/prism.css", "build/prism.css", (err) => {});
    fs.copyFile("static/prism.js", "build/prism.js", (err) => {});
  }

  function compileIndex() {
    const home = fs.readFileSync("templates/default.ejs", 'utf-8');
    const posts = fs.readFileSync("templates/home.ejs", 'utf-8');
    const postsListHtml = ejs.render(posts);
    const indexHtml = ejs.render(home, { content: postsListHtml });

    fs.writeFileSync("build/index.html", indexHtml);
  }

  function compilePages() {
    const filesNames = fs.readdirSync(pagesDir);
    const contents = filesNames.map(f => fs.readFileSync(`${pagesDir}/${f}`, 'utf-8'))
      .map(x => fm(x));

    console.log()
  }

  function compilePosts() {
    const filesNames = fs.readdirSync(postsDir);
    const template = fs.readFileSync("templates/default.ejs", 'utf-8');
    const contents = filesNames.map(f => fs.readFileSync(`${postsDir}/${f}`, 'utf-8'))
      .map(x => fm(x))
      .map(x => {
        return { content: marked.parse(x.body), meta: yaml.load(x.frontmatter) };
      });

    for (elem of contents) {
      const html = ejs.render(template, { content: elem.content });
      fs.writeFileSync(`build/posts/${elem.meta.date}-${elem.meta.slug}.html`, html);
    }
  }

  async function prepareBuildDir() {
    await rimraf("build");
    fs.mkdir("build", { recursive: true }, (err) => {
    });
    fs.mkdir("build/posts", { recursive: true }, (err) => {
    });
  }

  await prepareBuildDir();
  compileCss();
  compileIndex();
  compilePosts();
})();