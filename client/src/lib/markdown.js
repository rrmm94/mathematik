import { marked } from 'marked';
import katex from 'katex';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: false });

const cache = new Map();

// Wandelt Markdown mit LaTeX ($…$ und $$…$$) in sicheres HTML um.
export function renderMarkdown(src = '') {
  if (cache.has(src)) return cache.get(src);
  const math = [];
  const stash = (tex, display) => {
    let html;
    try {
      html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
    } catch {
      html = `<code>${tex.replace(/</g, '&lt;')}</code>`;
    }
    math.push(html);
    return `%%MATH${math.length - 1}%%`;
  };
  let text = String(src)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => stash(tex.trim(), true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => stash(tex.trim(), true))
    .replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_, pre, tex) => pre + stash(tex, false))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => stash(tex, false));
  let html = marked.parse(text);
  html = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
  html = html
    .replace(/<p>%%MATH(\d+)%%<\/p>/g, (_, i) => math[+i])
    .replace(/%%MATH(\d+)%%/g, (_, i) => math[+i]);
  if (cache.size > 500) cache.clear();
  cache.set(src, html);
  return html;
}
