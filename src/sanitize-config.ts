import type { IOptions } from "sanitize-html";

/**
 * Sanitize options used when rendering citation-annotated HTML reports.
 * Preserves <cite data-entity-id data-entity-type> tags required by the
 * citation gate badge transforms, while allowing common formatting elements.
 *
 * Extracted verbatim from INAA apps/web/src/lib/report/sanitize-config.ts
 * (AGPL-3.0-or-later, legal-citation-gate standalone library).
 */
export const reportSanitizeOptions: IOptions = Object.freeze({
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "div",
    "span",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "table",
    "tr",
    "td",
    "th",
    "thead",
    "tbody",
    "br",
    "hr",
    "blockquote",
    "img",
    "title",
    "cite",
    "details",
    "summary",
  ],
  allowedAttributes: {
    "*": ["style", "class", "id", "aria-label", "data-label"],
    a: ["href", "style", "class", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    cite: ["data-entity-type", "data-entity-id"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^rgba\(/, /^[a-zA-Z]+$/],
      "background-color": [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\(/,
        /^rgba\(/,
        /^[a-zA-Z]+$/,
      ],
      background: [
        /^#[0-9a-fA-F]{3,8}$/,
        /^rgb\(/,
        /^rgba\(/,
        /^[a-zA-Z]+$/,
      ],
      "font-size": [/^\d+(?:px|em|rem|%)$/],
      "font-weight": [/^(?:bold|normal|\d{3})$/],
      "font-family": [/^[-\w\s,']+$/],
      "text-align": [/^(?:left|center|right|justify)$/],
      "text-decoration": [
        /^(?:none|underline|line-through|overline)(?:\s|$)/,
      ],
      margin: [/^[-\d]+(?:px|em|rem|%)(?:\s|$)/, /^0\s+auto$/],
      "margin-top": [/^[-\d]+(?:px|em|rem|%)$/],
      "margin-bottom": [/^[-\d]+(?:px|em|rem|%)$/],
      "margin-left": [/^[-\d]+(?:px|em|rem|%)$/, /^auto$/],
      "margin-right": [/^[-\d]+(?:px|em|rem|%)$/, /^auto$/],
      padding: [/^[\d]+(?:px|em|rem|%)(?:\s|$)/],
      "padding-top": [/^[\d]+(?:px|em|rem|%)$/],
      "padding-bottom": [/^[\d]+(?:px|em|rem|%)$/],
      "padding-left": [/^[\d]+(?:px|em|rem|%)$/],
      "padding-right": [/^[\d]+(?:px|em|rem|%)$/],
      border: [/^\d+px\s/],
      "border-top": [/^\d+px\s/],
      "border-left": [/^\d+px\s/],
      "border-right": [/^\d+px\s/],
      "border-bottom": [/^\d+px\s/],
      "border-radius": [/^[\d]+(?:px|em|rem|%)$/],
      "border-collapse": [/^(?:collapse|separate)$/],
      "border-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(/, /^[a-zA-Z]+$/],
      "max-width": [/^[\d]+(?:px|em|rem|%)$/],
      width: [/^[\d]+(?:px|em|rem|%)$/, /^var\(--lv-bar-pct\)$/],
      "--lv-bar-pct": [/^\d+(?:\.\d+)?%$/],
      display: [
        /^(?:block|inline|inline-block|flex|none|table|table-row|table-cell)$/,
      ],
      "line-height": [/^[\d.]+(?:px|em|rem|%)?$/],
      "list-style": [
        /^(?:none|disc|circle|square|decimal|lower-alpha|upper-alpha)$/,
      ],
      overflow: [/^(?:auto|scroll|hidden|visible)$/],
      "overflow-x": [/^(?:auto|scroll|hidden|visible)$/],
      "-webkit-overflow-scrolling": [/^(?:auto|touch)$/],
    },
  },
}) as IOptions;
