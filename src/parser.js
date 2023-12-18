const { marked } = require('marked');
const katex = require('katex');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');

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

exports.default = function (input) {
    return marked.parse(input);
}