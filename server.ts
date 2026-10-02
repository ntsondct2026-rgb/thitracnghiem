import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import AdmZip from "adm-zip";
import mammoth from "mammoth";

const getAppDir = () => {
  try {
    if (typeof __dirname !== "undefined") {
      return __dirname;
    }
  } catch (e) {}
  
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {}

  return process.cwd();
};

const serverDir = getAppDir();

// Lazy initializer for Gemini client to avoid crashes if GEMINI_API_KEY is not configured on startup
let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Vui lòng thiết lập GEMINI_API_KEY trong Settings > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Squeeze word/document.xml down to its bare, pure text and math structures to fit in Gemini context beautifully
function cleanDocxXml(xml: string): string {
  if (!xml) return "";
  let cleaned = xml;

  // 1. Simplify document tag
  cleaned = cleaned.replace(/<w:document[^>]*>/, "<w:document>");

  // 2. Remove paragraph/run/table property nodes and formatting cruft
  cleaned = cleaned.replace(/<w:pPr[^>]*>[\s\S]*?<\/w:pPr>/g, "");
  cleaned = cleaned.replace(/<w:rPr[^>]*>[\s\S]*?<\/w:rPr>/g, "");
  cleaned = cleaned.replace(/<w:tblPr[^>]*>[\s\S]*?<\/w:tblPr>/g, "");
  cleaned = cleaned.replace(/<w:tcPr[^>]*>[\s\S]*?<\/w:tcPr>/g, "");
  cleaned = cleaned.replace(/<w:trPr[^>]*>[\s\S]*?<\/w:trPr>/g, "");

  // 3. Remove optional proofing, bookmarks, revisions information
  cleaned = cleaned.replace(/<w:proofErr[^>]*\/>/g, "");
  cleaned = cleaned.replace(/<w:bookmarkStart[^>]*\/>/g, "");
  cleaned = cleaned.replace(/<w:bookmarkEnd[^>]*\/>/g, "");
  cleaned = cleaned.replace(/<w:lastRenderedPageBreak[^>]*\/>/g, "");

  // 4. Simplify core structural tags by stripping namespaces and rsid attributes to save 80% character spaces
  cleaned = cleaned.replace(/<w:p(?:\s+[^>]*)?>/g, "<w:p>");
  cleaned = cleaned.replace(/<w:r(?:\s+[^>]*)?>/g, "<w:r>");
  cleaned = cleaned.replace(/<w:tbl(?:\s+[^>]*)?>/g, "<w:tbl>");
  cleaned = cleaned.replace(/<w:tr(?:\s+[^>]*)?>/g, "<w:tr>");
  cleaned = cleaned.replace(/<w:tc(?:\s+[^>]*)?>/g, "<w:tc>");

  // 5. Un-indent and normalize white spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const parts = dataUrl.split(",");
  if (parts.length < 2) return null;
  const mimePart = parts[0];
  const base64 = parts[1];

  const match = mimePart.match(/data:([^;]+)/);
  const mimeType = match ? match[1] : "image/png";
  return { mimeType, base64 };
}

function isStandardWebImage(base64: string): boolean {
  if (!base64) return false;
  const prefix = base64.substring(0, 15);
  return (
    prefix.startsWith("iVBORw0KGgo") ||
    prefix.startsWith("/9j/") ||
    prefix.startsWith("R0lGOD") ||
    prefix.startsWith("UklGR")
  );
}

function isMimeTypeSupportedByGemini(mimeType: string): boolean {
  const supported = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  return supported.includes(mimeType.toLowerCase());
}

// --- DETERMINISTIC OFFLINE OMML & MATHTYPE TO LATEX PARSER ---

const MATH_SYMBOL_MAP: { [key: string]: string } = {
  "±": "\\pm",
  "×": "\\times",
  "÷": "\\div",
  "≠": "\\neq",
  "≈": "\\approx",
  "≤": "\\le",
  "≥": "\\ge",
  "∞": "\\infty",
  "∈": "\\in",
  "∉": "\\notin",
  "⊂": "\\subset",
  "⊃": "\\supset",
  "⊆": "\\subseteq",
  "⊇": "\\supseteq",
  "∩": "\\cap",
  "∪": "\\cup",
  "∅": "\\emptyset",
  "→": "\\rightarrow",
  "⇒": "\\Rightarrow",
  "⇔": "\\Leftrightarrow",
  "↔": "\\leftrightarrow",
  "∀": "\\forall",
  "∃": "\\exists",
  "∂": "\\partial",
  "∇": "\\nabla",
  "∠": "\\angle",
  "⊥": "\\perp",
  "∥": "\\parallel",
  "△": "\\triangle",
  "π": "\\pi",
  "α": "\\alpha",
  "β": "\\beta",
  "γ": "\\gamma",
  "δ": "\\delta",
  "ε": "\\epsilon",
  "ζ": "\\zeta",
  "η": "\\eta",
  "θ": "\\theta",
  "ι": "\\iota",
  "κ": "\\kappa",
  "λ": "\\lambda",
  "μ": "\\mu",
  "ν": "\\nu",
  "ξ": "\\xi",
  "ο": "\\omicron",
  "ρ": "\\rho",
  "σ": "\\sigma",
  "τ": "\\tau",
  "υ": "\\upsilon",
  "φ": "\\varphi",
  "χ": "\\chi",
  "ψ": "\\psi",
  "ω": "\\omega",
  "Δ": "\\Delta",
  "Γ": "\\Gamma",
  "Θ": "\\Theta",
  "Λ": "\\Lambda",
  "Ξ": "\\Xi",
  "Π": "\\Pi",
  "Σ": "\\Sigma",
  "Φ": "\\Phi",
  "Ψ": "\\Psi",
  "Ω": "\\Omega",
  "°": "^\\circ",
  "√": "\\sqrt",
  "∫": "\\int",
  "∑": "\\sum",
  "prod": "\\prod"
};

interface XmlNode {
  tag: string;
  children: (XmlNode | string)[];
}

function parseXmlSimple(xml: string): XmlNode[] {
  const result: XmlNode[] = [];
  const stack: XmlNode[] = [];
  
  const regex = /(<\/?[a-zA-Z0-9_:]+[^>]*>)/g;
  const parts = xml.split(regex);
  
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("<")) {
      const isClosing = part.startsWith("</");
      const isSelfClosing = part.endsWith("/>") || part.endsWith("/ >");
      
      const nameMatch = part.match(/<\/?([a-zA-Z0-9_:]+)/);
      if (!nameMatch) continue;
      const tagName = nameMatch[1];
      
      if (isClosing) {
        while (stack.length > 0) {
          const popped = stack.pop();
          if (popped && popped.tag === tagName) {
            break;
          }
        }
      } else {
        const node: XmlNode = { tag: tagName, children: [] };
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          result.push(node);
        }
        if (!isSelfClosing) {
          stack.push(node);
        }
      }
    } else {
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(part);
      }
    }
  }
  
  return result;
}

function ommlNodeToLatex(node: XmlNode | string): string {
  if (typeof node === "string") {
    let str = "";
    for (const char of node) {
      if (MATH_SYMBOL_MAP[char]) {
        str += " " + MATH_SYMBOL_MAP[char] + " ";
      } else {
        str += char;
      }
    }
    return str;
  }

  const tag = node.tag;
  const cleanTag = tag.includes(":") ? tag.split(":")[1] : tag;

  if (cleanTag === "t") {
    let textContent = "";
    for (const child of node.children) {
      if (typeof child === "string") {
        textContent += child;
      } else {
        textContent += ommlNodeToLatex(child);
      }
    }
    let converted = "";
    for (const char of textContent) {
      if (MATH_SYMBOL_MAP[char]) {
        converted += " " + MATH_SYMBOL_MAP[char] + " ";
      } else {
        converted += char;
      }
    }
    return converted;
  }

  if (cleanTag === "f") {
    const numChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:num" || c.tag === "num")) as XmlNode;
    const denChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:den" || c.tag === "den")) as XmlNode;
    const numLatex = numChild ? ommlChildrenToLatex(numChild.children) : "";
    const denLatex = denChild ? ommlChildrenToLatex(denChild.children) : "";
    return `\\frac{${numLatex}}{${denLatex}}`;
  }

  if (cleanTag === "rad") {
    const degChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:deg" || c.tag === "deg")) as XmlNode;
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const degLatex = degChild ? ommlChildrenToLatex(degChild.children).trim() : "";
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    if (degLatex) {
      return `\\sqrt[${degLatex}]{${eLatex}}`;
    } else {
      return `\\sqrt{${eLatex}}`;
    }
  }

  if (cleanTag === "sSup") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const supChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sup" || c.tag === "sup")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    const supLatex = supChild ? ommlChildrenToLatex(supChild.children) : "";
    return `{${eLatex}}^{${supLatex}}`;
  }

  if (cleanTag === "sSub") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const subChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sub" || c.tag === "sub")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    const subLatex = subChild ? ommlChildrenToLatex(subChild.children) : "";
    return `{${eLatex}}_{${subLatex}}`;
  }

  if (cleanTag === "sSubSup") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const subChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sub" || c.tag === "sub")) as XmlNode;
    const supChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sup" || c.tag === "sup")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    const subLatex = subChild ? ommlChildrenToLatex(subChild.children) : "";
    const supLatex = supChild ? ommlChildrenToLatex(supChild.children) : "";
    return `{${eLatex}}_{${subLatex}}^{${supLatex}}`;
  }

  if (cleanTag === "d") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    return `\\left( ${eLatex} \\right)`;
  }

  if (cleanTag === "bar") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";
    return `\\overline{${eLatex}}`;
  }

  if (cleanTag === "limLow") {
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    const limChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:lim" || c.tag === "lim")) as XmlNode;
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "lim";
    const limLatex = limChild ? ommlChildrenToLatex(limChild.children) : "";
    return `\\lim_{${limLatex}}`;
  }

  if (cleanTag === "nary") {
    const subChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sub" || c.tag === "sub")) as XmlNode;
    const supChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:sup" || c.tag === "sup")) as XmlNode;
    const eChild = node.children.find(c => typeof c !== "string" && (c.tag === "m:e" || c.tag === "e")) as XmlNode;
    
    const subLatex = subChild ? ommlChildrenToLatex(subChild.children) : "";
    const supLatex = supChild ? ommlChildrenToLatex(supChild.children) : "";
    const eLatex = eChild ? ommlChildrenToLatex(eChild.children) : "";

    const naryPr = node.children.find(c => typeof c !== "string" && (c.tag === "m:naryPr" || c.tag === "naryPr")) as XmlNode;
    let opSymbol = "\\int";
    if (naryPr) {
      const naryPrString = JSON.stringify(naryPr);
      if (naryPrString.includes("∑") || naryPrString.includes("sum")) opSymbol = "\\sum";
      else if (naryPrString.includes("∏") || naryPrString.includes("prod")) opSymbol = "\\prod";
    }

    let res = opSymbol;
    if (subLatex) res += `_{${subLatex}}`;
    if (supLatex) res += `^{${supLatex}}`;
    return `${res} ${eLatex}`;
  }

  return ommlChildrenToLatex(node.children);
}

function ommlChildrenToLatex(children: (XmlNode | string)[]): string {
  return children.map(ommlNodeToLatex).join("");
}

function decodeXmlEntities(str: string): string {
  if (!str) return "";
  let curr = str;
  let prev = "";
  for (let i = 0; i < 3; i++) {
    prev = curr;
    curr = curr
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, " ");
    if (curr === prev) break;
  }
  return curr;
}

function isMathFormula(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  
  // Exclude common file extensions and non-math terms immediately
  if (
    /\.(png|jpe?g|gif|webp|bmp|tiff|wmf|emf|svg)$/i.test(lower) ||
    lower.includes("hinh") ||
    lower.includes("hình") ||
    lower.includes("anh") ||
    lower.includes("ảnh") ||
    lower.includes("draw") ||
    lower.includes("screenshot") ||
    lower.includes("code") ||
    lower.includes("python") ||
    lower.includes("cpp") ||
    lower.includes("c++") ||
    lower.includes("chuong trinh") ||
    lower.includes("chuong_trinh") ||
    lower.includes("ma nguon") ||
    lower.includes("mã nguồn") ||
    lower.includes("diagram") ||
    lower.includes("chart") ||
    lower.includes("graph") ||
    lower.includes("picture") ||
    lower.includes("image") ||
    lower.includes("figure") ||
    lower.includes("photo")
  ) {
    return false;
  }

  // If it's a simple label like hinh_1, image_2, fig_3, etc., it's not math
  if (/^(?:hinh|image|img|pic|picture|fig|figure|photo|draw|logo|media|ole|object|formula)[-_.]?\d+$/i.test(lower)) {
    return false;
  }

  // Explicit MathType / Equation indicators
  if (
    lower.includes("mathtype") || 
    lower.includes("equation") || 
    lower.includes("toggle tex") || 
    lower.includes("«") || 
    lower.includes("»")
  ) {
    return true;
  }
  
  // Standard LaTeX markup indicators
  if (text.includes("_")) {
    const parts = text.split("_");
    if (parts.length > 2) {
      return false; // Multiple underscores indicate filename/variable
    }
    const left = parts[0].trim();
    const right = parts[1].trim();
    const isLeftSimple = /^[a-zA-Z0-9α-ωΑ-ΩθπΔ]{1,4}$/.test(left);
    const isRightSimple = /^[a-zA-Z0-9α-ωΑ-ΩθπΔ{}]{1,5}$/.test(right);
    if (!isLeftSimple || !isRightSimple) {
      const hasMathIndicator = /\\|\{|\}|\^/.test(text);
      if (!hasMathIndicator) {
        return false;
      }
    }
  }

  if (
    text.includes("\\") || // Backslash for standard LaTeX macros
    text.includes("^") ||  // Superscript
    text.includes("{") ||  // Braces
    text.includes("}") ||
    text.includes("$")     // Inline math
  ) {
    return true;
  }
  
  // Math operators/greek characters
  const mathIndicators = [
    "\\pm", "\\times", "\\div", "\\neq", "\\leq", "\\geq", "\\alpha", "\\beta", 
    "\\gamma", "\\delta", "\\theta", "\\lambda", "\\pi", "\\sigma", "\\omega", 
    "\\Delta", "\\int", "\\sum", "\\infty", "\\sqrt", "\\frac", "\\vec", "\\sin", 
    "\\cos", "\\tan", "\\cot"
  ];
  if (mathIndicators.some(ind => lower.includes(ind))) {
    return true;
  }
  
  return false;
}

function extractMathText(xmlSnippet: string): string | null {
  // Matches any attribute whose name ends with 'title', 'descr', 'alt', or 'alttext',
  // ignoring any namespace prefix (e.g. o:title, wp:descr, alt, alttext, title)
  const genericAttrRegex = /\b[a-zA-Z0-9_:]*(title|descr|alt|alttext)\s*=\s*(["'])([\s\S]*?)\2/gi;
  
  let match;
  // Use executive regex loops to check all possible attributes containing formula text in the XML snippet
  while ((match = genericAttrRegex.exec(xmlSnippet)) !== null) {
    const val = match[3];
    if (val && val.trim().length > 0) {
      let cleaned = decodeXmlEntities(val).trim();
      
      // Keep stripping outer quotes of any style
      while (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
        (cleaned.startsWith("`") && cleaned.endsWith("`"))
      ) {
        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
      }

      // Strip pre-existing math delimiters wrapping the expression to avoid double wrapping
      while (
        (cleaned.startsWith('$$') && cleaned.endsWith('$$')) ||
        (cleaned.startsWith('$') && cleaned.endsWith('$')) ||
        (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) ||
        (cleaned.startsWith('\\(') && cleaned.endsWith('\\)'))
      ) {
        if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
          cleaned = cleaned.substring(1, cleaned.length - 1).trim();
        } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        } else if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        }
      }
      
      // Strip any MathType/Equation/OLE prefix wrappers
      cleaned = cleaned.replace(/^(?:Equation|MathType|OLE|Microsoft Equation|MathType Equation)\s*\d*(?:\s*|:)\s*/i, "").trim();
      cleaned = cleaned
        .replace(/«\s*Toggle TeX\s*»/gi, "")
        .replace(/»\s*Toggle TeX\s*«/gi, "")
        .replace(/\[\s*Toggle TeX\s*\]/gi, "")
        .replace(/Toggle TeX/gi, "")
        .trim();
      
      const lower = cleaned.toLowerCase();
      
      // Blacklist of system placeholders or actual graphic labels to avoid converting normal layouts
      if (
        !lower ||
        cleaned.includes("[!") ||
        cleaned.includes("[img") ||
        cleaned.includes("mathtype_") ||
        cleaned.includes("formula_") ||
        cleaned.includes("_toc") ||
        cleaned.includes("_Toc") ||
        lower === "equation" || 
        lower === "mathtype" || 
        lower === "embedded object" ||
        lower.startsWith("ole object") ||
        lower.startsWith("microsoft equation") ||
        lower.includes("hình") ||
        lower.includes("hinh") ||
        lower.includes("ảnh") ||
        lower.includes("anh") ||
        lower.includes("đồ thị") ||
        lower.includes("do thi") ||
        lower.includes("biểu đồ") ||
        lower.includes("bieu do") ||
        lower.includes("sơ đồ") ||
        lower.includes("so do") ||
        lower.includes("picture") ||
        lower.includes("image") ||
        lower.includes("diagram") ||
        lower.includes("figure") ||
        lower.includes("chart") ||
        lower.includes("graph") ||
        lower.includes("logo") ||
        lower.includes("photo") ||
        lower.includes("vector") ||
        lower.includes("draw") ||
        lower.includes("screenshot") ||
        lower.includes("code") ||
        lower.includes("python") ||
        lower.includes("cpp") ||
        lower.includes("c++") ||
        lower.includes("chuong trinh") ||
        lower.includes("chuong_trinh") ||
        lower.includes("ma nguon") ||
        lower.includes("mã nguồn") ||
        /\.(png|jpe?g|gif|webp|bmp|tiff|wmf|emf|svg)$/i.test(lower) ||
        /^(?:hinh|image|img|pic|picture|fig|figure|photo|draw|logo|media|ole|object|formula)[-_.]?\d+$/i.test(lower) ||
        /^(?:equation|mathtype|object|shape|embed|picture|image|ole|winword)\s*[-_.]?\s*\d*$/i.test(lower)
      ) {
        continue; 
      }

      // Since it passed the extensive blacklist filter above, we can safely treat it as formula/math text directly!
      if (cleaned.length > 0 && isMathFormula(cleaned)) {
        return cleaned;
      }
    }
  }
  return null;
}

function preprocessOmmlInXml(xml: string): string {
  if (!xml) return xml;

  let processedXml = xml;

  // 1. Preprocess AlternateContent (promote math Choice and delete unused fallback graphics) with or without prefix
  const altContentRegex = /<([a-zA-Z0-9_:]+)?AlternateContent[^>]*>([\s\S]*?)<\/([a-zA-Z0-9_:]+)?AlternateContent>/gi;
  processedXml = processedXml.replace(altContentRegex, (match, prefixStart, insideAlt, prefixEnd) => {
    // A. Check if the entire AlternateContent block contains an oMath element
    const oMathMatch = insideAlt.match(/<([a-zA-Z0-9_:]+)?oMath\b[^>]*>([\s\S]*?)<\/([a-zA-Z0-9_:]+)?oMath>/i);
    if (oMathMatch) {
      try {
        const fullOmmlXml = `<m:oMath>${oMathMatch[2]}</m:oMath>`;
        const tree = parseXmlSimple(fullOmmlXml);
        if (tree && tree.length > 0) {
          let latex = ommlNodeToLatex(tree[0]);
          latex = latex.replace(/\s+/g, " ").trim();
          const replacementText = `$${latex}$`;
          const escapedTex = replacementText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          // Always wrap inside a <w:r> run block so Mammoth correctly parses & renders it as text!
          return `<w:r><w:t xml:space="preserve"> ${escapedTex} </w:t></w:r>`;
        }
      } catch (e) {
        console.error("[AlternateContent] Error parsing inside oMath:", e);
      }
    }

    // B. Check if the entire AlternateContent block has attributes representing a math formula (MathType OLE objects)
    const mathText = extractMathText(insideAlt);
    if (mathText) {
      const wrappedMath = `$${mathText}$`;
      const escapedMath = wrappedMath
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // Always wrap inside a <w:r> run block so Mammoth correctly parses & renders it as text!
      return `<w:r><w:t xml:space="preserve"> ${escapedMath} </w:t></w:r>`;
    }

    // C. Non-math drawing/picture representation fallback
    // Since Mammoth cannot natively parse <mc:AlternateContent> nested structures, we MUST unwrap and promote the choice/fallback tags containing standard drawings/graphics!
    const choiceRegex = /<([a-zA-Z0-9_:]+)?Choice[^>]*>([\s\S]*?)<\/([a-zA-Z0-9_:]+)?Choice>/gi;
    let choiceContent = "";
    let choiceMatch;
    while ((choiceMatch = choiceRegex.exec(insideAlt)) !== null) {
      choiceContent += choiceMatch[2];
    }
    if (choiceContent.trim()) {
      return choiceContent;
    }
    const fallbackMatch = insideAlt.match(/<([a-zA-Z0-9_:]+)?Fallback[^>]*>([\s\S]*?)<\/([a-zA-Z0-9_:]+)?Fallback>/i);
    if (fallbackMatch && fallbackMatch[2].trim()) {
      return fallbackMatch[2];
    }
    return match; // Final resort
  });

  // 2. Preprocess standalone oMath XML representations
  const oMathRegex = /<([a-zA-Z0-9_:]+)?oMath\b[^>]*>([\s\S]*?)<\/([a-zA-Z0-9_:]+)?oMath>/gi;
  processedXml = processedXml.replace(oMathRegex, (match, prefix1, insideOmml, prefix2) => {
    try {
      const fullOmmlXml = `<m:oMath>${insideOmml}</m:oMath>`;
      const tree = parseXmlSimple(fullOmmlXml);
      if (tree && tree.length > 0) {
        let latex = ommlNodeToLatex(tree[0]);
        latex = latex.replace(/\s+/g, " ").trim();
        const replacementText = `$${latex}$`;
        const escapedTex = replacementText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        // Always wrap inside a <w:r> run block so Mammoth correctly parses & renders it as text!
        return `<w:r><w:t xml:space="preserve"> ${escapedTex} </w:t></w:r>`;
      }
    } catch (e) {
      console.error("[preprocessOmmlInXml] Error parsing standalone oMath:", e);
    }
    return match;
  });

  // 3. Preprocess any specific w:object or legacy shape that matches a math formula in its description attribute
  const tagsToProcess = ["object", "pict", "shape"];
  for (const tag of tagsToProcess) {
    const re = new RegExp(`<([a-zA-Z0-9_:]+)?${tag}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/([a-zA-Z0-9_:]+)?${tag}\\s*>)`, "gi");
    processedXml = processedXml.replace(re, (match) => {
      const mathText = extractMathText(match);
      if (mathText) {
        const wrappedMath = `$${mathText}$`;
        const escapedMath = wrappedMath
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        // Always wrap inside a <w:r> run block so Mammoth correctly parses & renders it as text!
        return `<w:r><w:t xml:space="preserve"> ${escapedMath} </w:t></w:r>`;
      }
      return match;
    });
  }

  return processedXml;
}

function postprocessMammothHtml(html: string): string {
  if (!html) return html;
  
  let processedHtml = html;
  const imgTagRegex = /<img\b([^>]*?)>/gi;
  processedHtml = processedHtml.replace(imgTagRegex, (imgTag) => {
    // Extract src, alt, and title
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
    const titleMatch = imgTag.match(/title=["']([^"']+)["']/i);

    const src = srcMatch ? srcMatch[1] : "";
    const alt = altMatch ? altMatch[1] : "";
    const title = titleMatch ? titleMatch[1] : "";

    const isWmfOrEmf = src.includes("image/x-wmf") || src.includes("image/x-emf") || src.includes("image/wmf") || src.includes("image/emf") || src.includes("wmf") || src.includes("emf");
    
    // Find the best available math text
    let mathText = "";
    if (alt && alt.trim()) {
      mathText = alt.trim();
    } else if (title && title.trim()) {
      mathText = title.trim();
    }

    if (mathText) {
      // Decode XML/HTML entities
      let cleaned = decodeXmlEntities(mathText).trim();
      
      // Strip any outer quotes
      while (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
        (cleaned.startsWith("`") && cleaned.endsWith("`"))
      ) {
        cleaned = cleaned.substring(1, cleaned.length - 1).trim();
      }

      // Strip pre-existing math delimiters wrapping the expression
      while (
        (cleaned.startsWith('$$') && cleaned.endsWith('$$')) ||
        (cleaned.startsWith('$') && cleaned.endsWith('$')) ||
        (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) ||
        (cleaned.startsWith('\\(') && cleaned.endsWith('\\)'))
      ) {
        if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
          cleaned = cleaned.substring(1, cleaned.length - 1).trim();
        } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        } else if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
          cleaned = cleaned.substring(2, cleaned.length - 2).trim();
        }
      }

      // Strip prefix wrappers
      cleaned = cleaned.replace(/^(?:Equation|MathType|OLE|Microsoft Equation|MathType Equation)\s*\d*(?:\s*|:)\s*/i, "").trim();
      cleaned = cleaned
        .replace(/«\s*Toggle TeX\s*»/gi, "")
        .replace(/»\s*Toggle TeX\s*«/gi, "")
        .replace(/\[\s*Toggle TeX\s*\]/gi, "")
        .replace(/Toggle TeX/gi, "")
        .trim();

      const lower = cleaned.toLowerCase();
      const isBlacklisted = 
        !lower ||
        cleaned.includes("[!") ||
        cleaned.includes("[img") ||
        cleaned.includes("mathtype_") ||
        cleaned.includes("formula_") ||
        cleaned.includes("_toc") ||
        cleaned.includes("_Toc") ||
        lower === "equation" || 
        lower === "mathtype" || 
        lower === "embedded object" ||
        lower.startsWith("ole object") ||
        lower.startsWith("microsoft equation") ||
        lower.includes("hình") ||
        lower.includes("hinh") ||
        lower.includes("ảnh") ||
        lower.includes("anh") ||
        lower.includes("đồ thị") ||
        lower.includes("do thi") ||
        lower.includes("biểu đồ") ||
        lower.includes("bieu do") ||
        lower.includes("sơ đồ") ||
        lower.includes("so do") ||
        lower.includes("picture") ||
        lower.includes("image") ||
        lower.includes("diagram") ||
        lower.includes("figure") ||
        lower.includes("chart") ||
        lower.includes("graph") ||
        lower.includes("logo") ||
        lower.includes("photo") ||
        lower.includes("vector") ||
        lower.includes("draw") ||
        lower.includes("screenshot") ||
        lower.includes("code") ||
        lower.includes("python") ||
        lower.includes("cpp") ||
        lower.includes("c++") ||
        lower.includes("chuong trinh") ||
        lower.includes("chuong_trinh") ||
        lower.includes("ma nguon") ||
        lower.includes("mã nguồn") ||
        /\.(png|jpe?g|gif|webp|bmp|tiff|wmf|emf|svg)$/i.test(lower) ||
        /^(?:hinh|image|img|pic|picture|fig|figure|photo|draw|logo|media|ole|object|formula)[-_.]?\d+$/i.test(lower) ||
        /^(?:equation|mathtype|object|shape|embed|picture|image|ole|winword)\s*[-_.]?\s*\d*$/i.test(lower);

      const isVerifiedMath = isMathFormula(cleaned);
      if (!isBlacklisted && isVerifiedMath) {
        return `$${cleaned}$`;
      }
    }

    return imgTag;
  });

  return processedHtml;
}

const DATA_DIR = path.join(serverDir, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const DB_PATH = path.join(DATA_DIR, "exam_bank.db");

// Since native SQLite3 has environment compilation mismatch (GLIBC requirement errors),
// we implement a robust pure JavaScript persistence layer. It stores the SQLite tables
// as JSON under the `exam_bank.db` file, maintaining 100% compatibility with the SQL API routes.
interface DBState {
  folders: any[];
  questions: any[];
  students: any[];
  exam_rooms: any[];
  student_results: any[];
  teachers: any[];
}

let dbState: DBState = {
  folders: [],
  questions: [],
  students: [],
  exam_rooms: [],
  student_results: [],
  teachers: []
};

// Initial Load
if (fs.existsSync(DB_PATH)) {
  try {
    const rawData = fs.readFileSync(DB_PATH, "utf-8");
    dbState = { ...dbState, ...JSON.parse(rawData) };
    console.log("Loaded persistent database from:", DB_PATH);
  } catch (err) {
    console.error("Failed to parse database file, starting clean state:", err);
  }
} else {
  fs.writeFileSync(DB_PATH, JSON.stringify(dbState, null, 2));
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbState, null, 2));
  } catch (err) {
    console.error("Failed to persist database state:", err);
  }
}

// Promisified DB helpers emulated using in-memory state with disk sync
const dbRun = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  const sqlClean = sql.trim().toLowerCase();

  // No-op transactions
  if (sqlClean.startsWith("begin") || sqlClean.startsWith("commit") || sqlClean.startsWith("rollback")) {
    return { lastID: 0, changes: 0 };
  }

  // DELETES
  if (sqlClean.startsWith("delete from")) {
    const id = params[0];
    if (sqlClean.includes("folders")) {
      dbState.folders = dbState.folders.filter(f => String(f.id) !== String(id));
      dbState.folders = dbState.folders.map(f => {
        if (String(f.parentId) === String(id)) {
          return { ...f, parentId: undefined };
        }
        return f;
      });
      dbState.students = dbState.students.map(s => {
        if (String(s.folderId) === String(id)) {
          return { ...s, folderId: undefined };
        }
        return s;
      });
    } else if (sqlClean.includes("questions")) {
      dbState.questions = dbState.questions.filter(q => String(q.id) !== String(id));
    } else if (sqlClean.includes("students")) {
      dbState.students = dbState.students.filter(s => String(s.id) !== String(id));
    } else if (sqlClean.includes("exam_rooms")) {
      dbState.exam_rooms = dbState.exam_rooms.filter(r => String(r.id) !== String(id));
    } else if (sqlClean.includes("student_results")) {
      dbState.student_results = dbState.student_results.filter(r => String(r.id) !== String(id));
    } else if (sqlClean.includes("teachers")) {
      dbState.teachers = dbState.teachers.filter(t => String(t.id) !== String(id));
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  // INSERTS
  if (sqlClean.startsWith("insert into folders")) {
    const [id, name, createdAt, teacherId, parentId, type] = params;
    const existingIdx = dbState.folders.findIndex(f => f.id === id);
    const folder = { id, name, createdAt, teacherId: teacherId || undefined, parentId: parentId || undefined, type: type || 'question' };
    if (existingIdx >= 0) {
      dbState.folders[existingIdx] = { ...dbState.folders[existingIdx], ...folder };
    } else {
      dbState.folders.push(folder);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  if (sqlClean.startsWith("insert into questions")) {
    const [id, part, question, A, B, C, D, statements, answer, folderId, teacherId] = params;
    const existingIdx = dbState.questions.findIndex(q => q.id === id);
    const qRecord = { id, part, question, A, B, C, D, statements, answer, folderId, teacherId: teacherId || undefined };
    if (existingIdx >= 0) {
      dbState.questions[existingIdx] = { ...dbState.questions[existingIdx], ...qRecord };
    } else {
      dbState.questions.push(qRecord);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  if (sqlClean.startsWith("insert into students")) {
    const [id, name, createdAt, teacherId, className, folderId] = params;
    const existingIdx = dbState.students.findIndex(s => s.id === id);
    const student = { 
      id, 
      name, 
      createdAt,
      teacherId: teacherId || undefined,
      className: className || undefined,
      folderId: folderId || undefined
    };
    if (existingIdx >= 0) {
      dbState.students[existingIdx] = { ...dbState.students[existingIdx], ...student };
    } else {
      dbState.students.push(student);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  if (sqlClean.startsWith("insert into teachers")) {
    const [id, name, className, password, createdAt] = params;
    const existingIdx = dbState.teachers.findIndex(t => t.id === id);
    const teacher = { id, name, className, password, createdAt: createdAt || new Date().toISOString() };
    if (existingIdx >= 0) {
      dbState.teachers[existingIdx] = teacher;
    } else {
      dbState.teachers.push(teacher);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  if (sqlClean.startsWith("insert into exam_rooms")) {
    const [id, name, code, duration, startTime, endTime, releaseTime, isActive, questionIds, teacherId] = params;
    const existingIdx = dbState.exam_rooms.findIndex(r => r.id === id);
    const room = { 
      id, 
      name, 
      code, 
      duration, 
      startTime, 
      endTime, 
      releaseTime, 
      isActive, 
      questionIds,
      teacherId: teacherId || undefined
    };
    if (existingIdx >= 0) {
      dbState.exam_rooms[existingIdx] = { ...dbState.exam_rooms[existingIdx], ...room };
    } else {
      dbState.exam_rooms.push(room);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  if (sqlClean.startsWith("insert into student_results")) {
    const [id, studentName, studentId, score, part1Score, part2Score, part3Score, timestamp, answers] = params;
    const existingIdx = dbState.student_results.findIndex(r => r.id === id);
    const result = { id, studentName, studentId, score, part1Score, part2Score, part3Score, timestamp, answers };
    if (existingIdx >= 0) {
      dbState.student_results[existingIdx] = result;
    } else {
      dbState.student_results.push(result);
    }
    saveDB();
    return { lastID: 0, changes: 1 };
  }

  return { lastID: 0, changes: 0 };
};

const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  const sqlClean = sql.trim().toLowerCase();

  if (sqlClean.includes("from folders")) {
    const list = [...dbState.folders];
    if (sqlClean.includes("order by createdat desc")) {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return list;
  }

  if (sqlClean.includes("from questions")) {
    return [...dbState.questions];
  }

  if (sqlClean.includes("from students")) {
    const list = [...dbState.students];
    if (sqlClean.includes("order by createdat desc")) {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return list;
  }

  if (sqlClean.includes("from exam_rooms")) {
    return [...dbState.exam_rooms];
  }

  if (sqlClean.includes("from student_results")) {
    const list = [...dbState.student_results];
    if (sqlClean.includes("order by timestamp desc")) {
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }
    return list;
  }

  if (sqlClean.includes("from teachers")) {
    const list = [...dbState.teachers];
    if (sqlClean.includes("order by createdat desc")) {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return list;
  }

  return [];
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: "50mb" }));

  // Disable caching for all API endpoints to prevent stale database state in browsers
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // --- API ROUTES FOR FOLDERS ---
  app.get("/api/folders", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM folders ORDER BY createdAt DESC");
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const { id, name, createdAt, teacherId, parentId, type } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: "Missing required fields folder" });
      }
      await dbRun(
        "INSERT INTO folders (id, name, createdAt, teacherId, parentId, type) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, createdAt=excluded.createdAt, parentId=excluded.parentId, type=excluded.type",
        [id, name, createdAt || new Date().toISOString(), teacherId || null, parentId || null, type || 'question']
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/folders/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM folders WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTE FOR OFFLINE DETERMINISTIC WORD PARSING (No AI, converts MathType shapes and OMML formulas directly, preserves tables/images) ---
  app.post("/api/parse-docx-native", async (req, res) => {
    try {
      const { fileBase64 } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "Thiếu dữ liệu tệp tin đính kèm!" });
      }

      const buffer = Buffer.from(fileBase64, "base64");

      // Preprocess docx with our OMML-to-LaTeX converter
      const zip = new AdmZip(buffer);
      const docEntry = zip.getEntries().find(entry => entry.entryName === "word/document.xml");
      if (docEntry) {
        const docxContent = docEntry.getData().toString("utf8");
        const preprocessedXml = preprocessOmmlInXml(docxContent);
        zip.updateFile("word/document.xml", Buffer.from(preprocessedXml, "utf8"));
      }
      const modifiedBuffer = zip.toBuffer();

      // Convert preprocessed Word to HTML using Mammoth
      const mammothResult = await mammoth.convertToHtml(
        { buffer: modifiedBuffer },
        {
          convertImage: mammoth.images.imgElement((image: any) => {
            return image.readAsBase64String().then((imageBuffer: any) => {
              const altText = (image.altText || "").trim();
              return {
                src: `data:${image.contentType};base64,${imageBuffer}`,
                alt: altText,
                title: altText
              };
            });
          })
        }
      );
      const html = postprocessMammothHtml(mammothResult.value || "");

      res.json({ html });
    } catch (err: any) {
      console.error("[parse-docx-native] Error:", err);
      res.status(500).json({ error: err.message || "Lỗi khi xử lý file Word offline." });
    }
  });

  // --- API ROUTE FOR AI WORD PARSING (MATHTYPE / LATEX TO KATEX, IMAGES & TABLES PRESERVED) ---
  app.post("/api/parse-docx-ai", async (req, res) => {
    try {
      const { fileBase64, folderId } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "Thiếu dữ liệu tệp tin đính kèm!" });
      }

      const rawBuffer = Buffer.from(fileBase64, "base64");

      // Preprocess docx with our OMML-to-LaTeX converter first to help Gemini read formulas perfectly
      const zip = new AdmZip(rawBuffer);
      let docxContent = "";
      let hasXml = false;
      const docEntry = zip.getEntries().find(entry => entry.entryName === "word/document.xml");
      if (docEntry) {
        docxContent = docEntry.getData().toString("utf8");
        hasXml = true;
        const preprocessedXml = preprocessOmmlInXml(docxContent);
        zip.updateFile("word/document.xml", Buffer.from(preprocessedXml, "utf8"));
      }
      const buffer = zip.toBuffer();

      // 1. Convert Word to HTML using Mammoth to extract table structures (<table>, <tr>, <td>) and image data URIs
      let mammothHtml = "";
      const imageMap: { [key: string]: string } = {};
      let imgCount = 0;

      try {
        const mammothResult = await mammoth.convertToHtml(
          { buffer },
          {
            convertImage: mammoth.images.imgElement((image: any) => {
              return image.readAsBase64String().then((imageBuffer: any) => {
                const altText = (image.altText || "").trim();
                return {
                  src: `data:${image.contentType};base64,${imageBuffer}`,
                  alt: altText,
                  title: altText
                };
              });
            })
          }
        );
        mammothHtml = postprocessMammothHtml(mammothResult.value || "");
      } catch (mammothErr) {
        console.warn("Lỗi Mammoth convert on server:", mammothErr);
      }

      // Placeholderize images to avoid sending mega-byte Base64 characters to Gemini
      let placeholderizedHtml = mammothHtml;
      if (mammothHtml) {
        const dataUrlRegex = /src=["'](data:image\/[^"']+)["']/g;
        placeholderizedHtml = mammothHtml.replace(dataUrlRegex, (match, dataUrl) => {
          const placeholder = `[IMAGE_PLACEHOLDER_${imgCount++}]`;
          imageMap[placeholder] = dataUrl;
          return `src="${placeholder}"`;
        });
        console.log(`[AI DOCX Parser] Mammoth HTML parsed successfully. Encoded ${imgCount} images into placeholders.`);
      }

      // 2. Extract and preprocess raw XML word/document.xml to get exact MathType or OMML math formulas pre-translated to LaTeX!
      try {
        const zip = new AdmZip(buffer);
        const docEntry = zip.getEntries().find(entry => entry.entryName === "word/document.xml");
        if (docEntry) {
          const rawDocXml = docEntry.getData().toString("utf8");
          docxContent = preprocessOmmlInXml(rawDocXml);
          hasXml = true;
          console.log("[AI DOCX Parser] Extracted and preprocessed word/document.xml. Length:", docxContent.length);
        }
      } catch (zipErr) {
        console.warn("[AI DOCX Parser] Could not unzip docx using adm-zip:", zipErr);
      }

      const client = getGeminiClient();

      const prompt = `Bạn là một trợ lý AI thông minh chuyên nghiệp chuyên về số hóa đề thi Đánh giá năng lực tại Việt Nam. Bạn có khả năng phân tích cực kỳ chính xác cấu trúc văn bản Tiếng Việt, bảng biểu phức tạp và dịch toàn bộ công thức Toán học, Vật lý, Hóa học sang LaTeX chuẩn kẹp giữa ký tự $ (inline) hoặc $$ (block).

Nhiệm vụ của bạn là đọc thông tin đề thi được cung cấp dưới ba nguồn bổ trợ:
1. Bản HTML đã được bóc tách từ Docx (trong đó chứa đầy đủ cấu trúc bảng <table>, <tr>, <td> và các thẻ giữ chỗ hình ảnh dạng \`<img src="[IMAGE_PLACEHOLDER_x]" alt="Mô tả hoặc Công thức MathType nếu có" />\`).
2. Bản XML cấu trúc thu gọn (đã lọc bớt các thẻ trang trí dư thừa) chứa đầy đủ các phân số, căn số, số mũ và ký tự toán học native OMML/MathType gốc của MS Word.
3. Các hình ảnh đính kèm tương ứng trực tiếp với từng thẻ giữ chỗ \`[IMAGE_PLACEHOLDER_x]\` được chuyển thành ảnh đa phương thức (inlineData).

CÁC QUY TẮC BẮT BUỘC VÀ QUAN TRỌNG:
1. NHẬN DIỆN CÔNG THỨC MATHTYPE QUA THUỘC TÍNH 'ALT': 
   Hãy ĐẶC BIỆT chú ý kiểm tra thuộc tính 'alt' của các thẻ \`<img src="[IMAGE_PLACEHOLDER_x]" alt="..." />\`. Nếu thuộc tính 'alt' này chứa công thức Toán học dưới dạng LaTeX, ký tự đặc biệt, hoặc mô tả của MathType (ví dụ: \`alt="y = x^2 + 1"\` hoặc \`alt="x \\in AB"\`), bạn phải ƯU TIÊN SỬ DỤNG ngay nội dung này và dịch nó thành công thức LaTeX chuẩn đặt trong dấu đô-la \`$...$\` hoặc \`$$...$$\` để thay thế hoàn toàn thẻ ảnh đó. Cách này giúp nhận dạng công thức MathType chính xác 100%.
2. NHẬN DIỆN CÔNG THỨC MATHTYPE QUA HÌNH ẢNH (BẰNG VISION):
   Nếu thuộc tính 'alt' trống hoặc chỉ chứa mô tả chung (ví dụ: 'Word Equation' hoặc 'Picture'), và hình ảnh tương ứng được đính kèm là hình chụp công thức toán/lý/hóa (biểu thức toán học), hãy sử dụng năng lực Vision của bạn để nhìn hình và dịch công thức đó sang LaTeX chuẩn kẹp trong \`$...$\` hoặc \`$$...$$\`. Thay thế hoàn toàn thẻ \`<img src="[IMAGE_PLACEHOLDER_x]" />\` bằng công thức LaTeX thu được.
3. GIỮ NGUYÊN TẤT CẢ HÌNH ẢNH MINH HỌA, SƠ ĐỒ VÀ CÁC THẺ ẢNH KHÁC:
   Bất kỳ hình ảnh nào không phải là một công thức toán dòng đơn giản có thể quy đổi trực tiếp và hoàn hảo sang LaTeX (ví dụ: hình vẽ hình học không gian, đồ thị hàm số, sơ đồ phản ứng, ảnh chụp mã nguồn/đoạn chương trình Python/C++, ảnh chụp bảng dữ liệu thực tế, hình minh họa câu hỏi...), bạn TUYỆT ĐỐI KHÔNG ĐƯỢC lược bỏ hay dịch tùy tiện thành chữ. Bạn PHẢI GIỮ NGUYÊN thẻ \`<img src="[IMAGE_PLACEHOLDER_x]" />\` chính xác tại vị trí gốc trong câu hỏi, trong các phương án hoặc trong các khẳng định đúng sai, đảm bảo người dùng có thể xem được đầy đủ hình ảnh gốc trên frontend. Không được bỏ sót hay sửa đổi thuộc tính src!
4. GIỮ NGUYÊN CẤU TRÚC BẢNG:
   Giữ nguyên 100% các cấu trúc bảng biểu HTML (\`<table>\`, \`<tr>\`, \`<td>\`...) và lồng công thức LaTeX gọn gàng vào trong các ô của bảng nếu ô đó chứa công thức.
5. CHUYỂN ĐỔI TOÀN BỘ CÔNG THỨC TOÁN HỌC:
   Chuyển đổi toàn bộ biểu thức toán học (kể cả các ký hiệu đơn giản như x, y, S, a, b, d, các phân số, tích phân, căn bậc hai...) thành LaTeX chuẩn kẹp giữa cặp ký tự \`$\` (inline) hoặc \`$$\` (block). Ví dụ: 'hàm số y = f(x)' -> 'hàm số $y = f(x)$', 'x thuộc AB' -> '$x \\in AB$'.
6. TRÁNH TRÙNG LẶP NỘI DUNG:
   Nếu bản HTML và bản XML mô tả cùng một đoạn văn hoặc một công thức, hãy kết hợp chúng để biên dịch ra một câu duy nhất gồm Tiếng Việt chuẩn và công thức LaTeX (tránh lặp lại câu).
7. PHÂN CHIA ĐỀ THI THÀNH DANH SÁCH CÂU HỎI THEO 3 PHẦN KHÁCH QUAN:
   - Phần 1 (PART1): Câu hỏi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D). "part" = 1. Gán đáp án đúng (A/B/C/D) vào "answerString".
   - Phần 2 (PART2): Câu hỏi trắc nghiệm Đúng/Sai với 4 khẳng định a, b, c, d. "part" = 2. Gán nội dung từng khẳng định vào trường "statements" tương ứng, và gán trạng thái Đúng/Sai vào "answerTrueFalse" dưới dạng { "a": true/false, "b": true/false, "c": true/false, "d": true/false }.
   - Phần 3 (PART3): Trắc nghiệm trả lời ngắn (chỉ có câu hỏi và kết quả ngắn gọn dạng số hoặc biểu thức). "part" = 3. Gán kết quả thích hợp vào "answerString".
8. KHÔNG TỰ Ý BỎ BẤT KỲ CÂU HỎI NÀO TRONG ĐỀ THI GỐC. Luôn luôn trả về mảng JSON đúng sơ đồ cấu trúc.`;

      const parts: any[] = [
        { text: prompt }
      ];

      if (placeholderizedHtml) {
        parts.push({ text: `BẢN HTML ĐỀ THI ĐỒNG BỘ (CHỨA CẤU TRÚC BẢNG VÀ HÌNH ẢNH GIỮ CHỖ):\n\n${placeholderizedHtml}` });
      }
      if (hasXml) {
        const cleanedXml = cleanDocxXml(docxContent);
        console.log(`[AI DOCX Parser] Squeezed XML length from ${docxContent.length} down to ${cleanedXml.length}.`);
        parts.push({ text: `CẤU TRÚC XML CỦA ĐỀ THI GỐC (Bản nén thu gọn đã dịch sẵn công thức sang LaTeX):\n\n${cleanedXml}` });
      }

      // Đính kèm các hình ảnh trong document dưới dạng multipart để Gemini hỗ trợ nhìn công thức/hình vẽ
      let attachedImagesCount = 0;
      for (const [placeholder, dataUrl] of Object.entries(imageMap)) {
        if (attachedImagesCount >= 25) break; // Giới hạn 25 ảnh để tránh tràn token / vượt dung lượng payload
        const parsed = parseDataUrl(dataUrl);
        if (parsed) {
          const { mimeType, base64 } = parsed;
          if (isMimeTypeSupportedByGemini(mimeType) && isStandardWebImage(base64)) {
            parts.push({ text: `\nHình ảnh đính kèm tương ứng trực tiếp với thẻ giữ chỗ ${placeholder}:` });
            parts.push({
              inlineData: {
                data: base64,
                mimeType
              }
            });
            attachedImagesCount++;
          }
        }
      }
      console.log(`[AI DOCX Parser] Đã đính kèm dữ liệu ảnh cho ${attachedImagesCount} / ${Object.keys(imageMap).length} thẻ giữ chỗ vào Gemini.`);

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                part: {
                  type: Type.INTEGER,
                  description: "Phần thi: 1 (Trắc nghiệm đơn), 2 (Đúng/Sai), 3 (Trả lời ngắn)"
                },
                question: {
                  type: Type.STRING,
                  description: "Nội dung câu hỏi đầy đủ, bao gồm văn bản Tiếng Việt, câu từ, LaTeX kẹp giữa $...$ hoặc $$...$$, kèm cấu trúc HTML của bảng biểu <table> hoặc hình ảnh <img src=\"[IMAGE_PLACEHOLDER_x]\" /> ở vị trí thích hợp."
                },
                A: { type: Type.STRING, description: "Nội dung phương án A. Giữ nguyên công thức LaTeX hoặc thẻ ảnh giữ chỗ nếu thuộc phương án A." },
                B: { type: Type.STRING, description: "Nội dung phương án B. Giữ nguyên công thức LaTeX hoặc thẻ ảnh giữ chỗ nếu thuộc phương án B." },
                C: { type: Type.STRING, description: "Nội dung phương án C. Giữ nguyên công thức LaTeX hoặc thẻ ảnh giữ chỗ nếu thuộc phương án C." },
                D: { type: Type.STRING, description: "Nội dung phương án D. Giữ nguyên công thức LaTeX hoặc thẻ ảnh giữ chỗ nếu thuộc phương án D." },
                statements: {
                  type: Type.OBJECT,
                  properties: {
                    a: { type: Type.STRING, description: "Khẳng định a và các công thức LaTeX, hình ảnh kèm theo (nếu có)." },
                    b: { type: Type.STRING, description: "Khẳng định b và các công thức LaTeX, hình ảnh kèm theo (nếu có)." },
                    c: { type: Type.STRING, description: "Khẳng định c và các công thức LaTeX, hình ảnh kèm theo (nếu có)." },
                    d: { type: Type.STRING, description: "Khẳng định d và các công thức LaTeX, hình ảnh kèm theo (nếu có)." }
                  }
                },
                answerString: { type: Type.STRING, description: "Đáp án đúng cho Phần 1 (ví dụ: 'A', 'B', 'C', 'D') hoặc Phần 3 (ví dụ: '12' hoặc '5/3')" },
                answerTrueFalse: {
                  type: Type.OBJECT,
                  properties: {
                    a: { type: Type.BOOLEAN },
                    b: { type: Type.BOOLEAN },
                    c: { type: Type.BOOLEAN },
                    d: { type: Type.BOOLEAN }
                  }
                }
              },
              required: ["part", "question"]
            }
          }
        }
      });

      const text = response.text || "[]";
      const rawQuestions = JSON.parse(text.trim());

      // 1. Phân bổ placeholder ảnh gốc theo từng câu hỏi xuất hiện tuần tự
      const extractPlaceholdersByQuestionIndex = (html: string): { [qIndex: number]: string[] } => {
        const result: { [qIndex: number]: string[] } = {};
        const qMarkerRegex = /<p\b[^>]*>(?:<strong>)?(?:Câu\s*hỏi\s*(\d+)|Câu\s*(\d+)|Question\s*(\d+)|Q\s*(\d+)|(\d+)\b)/gi;
        const markers: { index: number; qNum: number }[] = [];
        
        let match;
        while ((match = qMarkerRegex.exec(html)) !== null) {
          const qNum = Number(match[1] || match[2] || match[3] || match[4] || match[5]);
          if (!isNaN(qNum)) {
            markers.push({ index: match.index, qNum });
          }
        }
        
        markers.sort((a, b) => a.index - b.index);
        
        const getPlaceholdersInSubstring = (sub: string): string[] => {
          const list: string[] = [];
          const pRegex = /\[IMAGE_PLACEHOLDER_(\d+)\]/g;
          let pMatch;
          while ((pMatch = pRegex.exec(sub)) !== null) {
            list.push(`[IMAGE_PLACEHOLDER_${pMatch[1]}]`);
          }
          return list;
        };
        
        if (markers.length === 0) {
          const allPlaceholders = getPlaceholdersInSubstring(html);
          result[1] = allPlaceholders;
          return result;
        }
        
        const beforeFirst = html.substring(0, markers[0].index);
        const beforeFirstPlaceholders = getPlaceholdersInSubstring(beforeFirst);
        result[markers[0].qNum] = [...beforeFirstPlaceholders];
        
        for (let i = 0; i < markers.length; i++) {
          const start = markers[i].index;
          const end = (i + 1 < markers.length) ? markers[i + 1].index : html.length;
          const qNum = markers[i].qNum;
          
          const segment = html.substring(start, end);
          const placeholders = getPlaceholdersInSubstring(segment);
          
          if (!result[qNum]) {
            result[qNum] = [];
          }
          result[qNum].push(...placeholders);
        }
        
        return result;
      };

      const autoRecoverMissingImages = (html: string, processedQuestions: any[]) => {
        const pMap = extractPlaceholdersByQuestionIndex(html);
        const keys = Object.keys(pMap).map(Number).sort((a, b) => a - b);
        
        for (let i = 0; i < processedQuestions.length; i++) {
          const q = processedQuestions[i];
          const qNum = keys[i];
          if (qNum === undefined) continue;
          
          const expectedPlaceholders = pMap[qNum] || [];
          if (expectedPlaceholders.length === 0) continue;
          
          const qJson = JSON.stringify(q);
          
          for (const placeholder of expectedPlaceholders) {
            if (!qJson.includes(placeholder)) {
              console.log(`[AI Auto-Recovery] Detected missing placeholder ${placeholder} in Gemini response for Question index ${qNum}. Restoring...`);
              if (!q.question) q.question = "";
              q.question = q.question.trim() + `<div class="image-wrapper my-3 flex justify-center"><img src="${placeholder}" class="max-w-full h-auto rounded-xl shadow-sm border border-gray-150" /></div>`;
            }
          }
        }
      };

      // Tự động cứu trợ khôi phục ảnh bị thiếu trước khi phục hồi base64 và xây dựng schema
      autoRecoverMissingImages(placeholderizedHtml, rawQuestions);

      // Helper function to restore image placeholder back to original Base64 data URI
      const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      const restorePlaceholders = (str: string, map: { [key: string]: string }): string => {
        if (!str) return "";
        let res = str;
        for (const [placeholder, originalSrc] of Object.entries(map)) {
          res = res.replace(new RegExp(escapeRegExp(placeholder), "g"), originalSrc);
        }
        return res;
      };

      // Map back to our exact client-side Question Schema and restore image strings
      const processed = rawQuestions.map((q: any) => {
        const mapped: any = {
          id: "imported-" + Math.random().toString(36).substring(2, 11),
          part: Number(q.part) || 1,
          question: restorePlaceholders(q.question || "", imageMap),
          folderId: folderId || undefined
        };

        if (mapped.part === 1) {
          mapped.A = restorePlaceholders(q.A || "Phương án A", imageMap);
          mapped.B = restorePlaceholders(q.B || "Phương án B", imageMap);
          mapped.C = restorePlaceholders(q.C || "Phương án C", imageMap);
          mapped.D = restorePlaceholders(q.D || "Phương án D", imageMap);
          mapped.answer = q.answerString ? q.answerString.trim().toUpperCase() : "A";
        } else if (mapped.part === 2) {
          const rawStmts = q.statements || { a: "Khẳng định a", b: "Khẳng định b", c: "Khẳng định c", d: "Khẳng định d" };
          mapped.statements = {
            a: restorePlaceholders(rawStmts.a || "", imageMap),
            b: restorePlaceholders(rawStmts.b || "", imageMap),
            c: restorePlaceholders(rawStmts.c || "", imageMap),
            d: restorePlaceholders(rawStmts.d || "", imageMap)
          };
          mapped.answer = q.answerTrueFalse || { a: true, b: true, c: true, d: false };
        } else if (mapped.part === 3) {
          mapped.answer = restorePlaceholders(q.answerString ? q.answerString.trim() : "", imageMap);
        }

        return mapped;
      });

      res.json(processed);
    } catch (err: any) {
      console.error("Lỗi parseDocxAI:", err);
      res.status(500).json({ error: err.message || "Không thể phân tích tệp tin bằng AI. Vui lòng kiểm tra lại cấu trúc tệp hoặc khóa API." });
    }
  });

  // --- API ROUTES FOR QUESTIONS ---
  app.get("/api/questions", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM questions");
      const questions = rows.map(r => ({
        ...r,
        statements: r.statements ? JSON.parse(r.statements) : undefined,
        answer: r.answer && (r.answer.startsWith("{") || r.answer.startsWith("[")) ? JSON.parse(r.answer) : r.answer
      }));
      res.json(questions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const data = req.body;
      const questionsToSave = Array.isArray(data) ? data : [data];
      
      await dbRun("BEGIN TRANSACTION");
      try {
        for (const q of questionsToSave) {
          const statementsStr = q.statements ? JSON.stringify(q.statements) : null;
          const answerStr = typeof q.answer === "object" ? JSON.stringify(q.answer) : q.answer;
          await dbRun(
            `INSERT INTO questions (id, part, question, A, B, C, D, statements, answer, folderId, teacherId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
             ON CONFLICT(id) DO UPDATE SET 
               part=excluded.part, 
               question=excluded.question, 
               A=excluded.A, 
               B=excluded.B, 
               C=excluded.C, 
               D=excluded.D, 
               statements=excluded.statements, 
               answer=excluded.answer, 
               folderId=excluded.folderId`,
            [q.id, q.part, q.question, q.A || null, q.B || null, q.C || null, q.D || null, statementsStr, answerStr, q.folderId || null, q.teacherId || null]
          );
        }
        await dbRun("COMMIT");
        res.json({ success: true, count: questionsToSave.length });
      } catch (transactionErr) {
        await dbRun("ROLLBACK");
        throw transactionErr;
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM questions WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTES FOR STUDENTS ---
  app.get("/api/students", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM students ORDER BY createdAt DESC");
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const data = req.body;
      const studentsToSave = Array.isArray(data) ? data : [data];
      
      await dbRun("BEGIN TRANSACTION");
      try {
        for (const s of studentsToSave) {
          await dbRun(
            "INSERT INTO students (id, name, createdAt, teacherId, className, folderId) VALUES (?, ?, ?, ?, ?, ?)",
            [s.id, s.name, s.createdAt || new Date().toISOString(), s.teacherId || null, s.className || null, s.folderId || null]
          );
        }
        await dbRun("COMMIT");
        res.json({ success: true, count: studentsToSave.length });
      } catch (transactionErr) {
        await dbRun("ROLLBACK");
        throw transactionErr;
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM students WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/students/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Missing or invalid students list to delete" });
      }
      await dbRun("BEGIN TRANSACTION");
      try {
        for (const id of ids) {
          await dbRun("DELETE FROM students WHERE id = ?", [id]);
        }
        await dbRun("COMMIT");
        res.json({ success: true, count: ids.length });
      } catch (transactionErr) {
        await dbRun("ROLLBACK");
        throw transactionErr;
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTES FOR TEACHERS ---
  app.get("/api/teachers", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM teachers ORDER BY createdAt DESC");
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const { id, name, className, password } = req.body;
      if (!id || !name || !className || !password) {
        return res.status(400).json({ error: "Thiếu thông tin đăng ký giáo viên" });
      }
      await dbRun(
        "INSERT INTO teachers (id, name, className, password, createdAt) VALUES (?, ?, ?, ?, ?)",
        [id, name, className, password, new Date().toISOString()]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM teachers WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTES FOR EXAM ROOMS ---
  app.get("/api/exam-rooms", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM exam_rooms");
      const rooms = rows.map(r => ({
        ...r,
        isActive: r.isActive === 1,
        questionIds: r.questionIds ? JSON.parse(r.questionIds) : []
      }));
      res.json(rooms);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/exam-rooms", async (req, res) => {
    try {
      const { id, name, code, duration, startTime, endTime, releaseTime, isActive, questionIds, part1Point, part2Point1, part2Point2, part2Point3, part2Point4, part3Point, allowReview, teacherId, shuffleQuestions, shuffleAnswers } = req.body;
      const qIdsStr = questionIds ? JSON.stringify(questionIds) : '[]';
      const activeInt = isActive ? 1 : 0;
      await dbRun(
        `INSERT INTO exam_rooms (id, name, code, duration, startTime, endTime, releaseTime, isActive, questionIds, teacherId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           code=excluded.code,
           duration=excluded.duration,
           startTime=excluded.startTime,
           endTime=excluded.endTime,
           releaseTime=excluded.releaseTime,
           isActive=excluded.isActive,
           questionIds=excluded.questionIds,
           teacherId=excluded.teacherId`,
        [id, name, code, duration, startTime || null, endTime || null, releaseTime || null, activeInt, qIdsStr, teacherId || null]
      );
      
      // Save custom grading configuration into the local JS dbState
      const existing = dbState.exam_rooms.find(r => r.id === id);
      if (existing) {
        existing.part1Point = typeof part1Point === 'number' ? part1Point : 0.25;
        existing.part2Point1 = typeof part2Point1 === 'number' ? part2Point1 : 0.1;
        existing.part2Point2 = typeof part2Point2 === 'number' ? part2Point2 : 0.25;
        existing.part2Point3 = typeof part2Point3 === 'number' ? part2Point3 : 0.5;
        existing.part2Point4 = typeof part2Point4 === 'number' ? part2Point4 : 1.0;
        existing.part3Point = typeof part3Point === 'number' ? part3Point : 0.25;
        existing.allowReview = typeof allowReview === 'boolean' ? allowReview : true;
        existing.teacherId = teacherId || undefined;
        existing.isFree = typeof req.body.isFree === 'boolean' ? req.body.isFree : false;
        existing.shuffleQuestions = typeof shuffleQuestions === 'boolean' ? shuffleQuestions : false;
        existing.shuffleAnswers = typeof shuffleAnswers === 'boolean' ? shuffleAnswers : false;
        saveDB();
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/exam-rooms/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM exam_rooms WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTES FOR STUDENT RESULTS ---
  app.get("/api/results", async (req, res) => {
    try {
      const rows = await dbAll("SELECT * FROM student_results ORDER BY timestamp DESC");
      const results = rows.map(r => {
        const answersObj = r.answers ? JSON.parse(r.answers) : {};
        return {
          ...r,
          answers: answersObj,
          examId: answersObj._examId || undefined,
          examName: answersObj._examName || undefined
        };
      });
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/results", async (req, res) => {
    try {
      const { id, studentName, studentId, score, part1Score, part2Score, part3Score, timestamp, answers } = req.body;
      const answersStr = answers ? JSON.stringify(answers) : '{}';
      await dbRun(
        `INSERT INTO student_results (id, studentName, studentId, score, part1Score, part2Score, part3Score, timestamp, answers)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           studentName=excluded.studentName,
           studentId=excluded.studentId,
           score=excluded.score,
           part1Score=excluded.part1Score,
           part2Score=excluded.part2Score,
           part3Score=excluded.part3Score,
           timestamp=excluded.timestamp,
           answers=excluded.answers`,
        [id || Date.now().toString(), studentName, studentId, score, part1Score, part2Score, part3Score, timestamp || new Date().toISOString(), answersStr]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/results/:id", async (req, res) => {
    try {
      await dbRun("DELETE FROM student_results WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
