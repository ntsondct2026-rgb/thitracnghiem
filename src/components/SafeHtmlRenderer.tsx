import React, { useMemo } from 'react';
import katex from 'katex';

interface SafeHtmlRendererProps {
  html?: string;
  className?: string;
}

export const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({ html = "", className = "" }) => {
  const renderedContent = useMemo(() => {
    if (!html) return "";
    
    let processed = html
      .replace(/«\s*Toggle TeX\s*»/gi, "")
      .replace(/»\s*Toggle TeX\s*«/gi, "")
      .replace(/\[\s*Toggle TeX\s*\]/gi, "")
      .replace(/Toggle TeX/gi, "");

    // Process <img> tags that contain MathType or LaTeX formulas in their alt/title attributes
    processed = processed.replace(/<img\b([^>]*?)>/gi, (imgTag, attrs) => {
      const altMatch = attrs.match(/alt=["']([\s\S]*?)["']/i);
      const titleMatch = attrs.match(/title=["']([\s\S]*?)["']/i);
      const val = (altMatch ? altMatch[1] : titleMatch ? titleMatch[1] : "").trim();
      
      if (!val) return imgTag;
      
      let decoded = val
        .replace(/«\s*Toggle TeX\s*»/gi, "")
        .replace(/»\s*Toggle TeX\s*«/gi, "")
        .replace(/\[\s*Toggle TeX\s*\]/gi, "")
        .replace(/Toggle TeX/gi, "");
      let prev = "";
      for (let i = 0; i < 3; i++) {
        prev = decoded;
        decoded = decoded
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&nbsp;/g, " ");
        if (decoded === prev) break;
      }

      decoded = decoded.trim();

      // Keep stripping outer quotes of any style
      while (
        (decoded.startsWith('"') && decoded.endsWith('"')) ||
        (decoded.startsWith("'") && decoded.endsWith("'")) ||
        (decoded.startsWith("`") && decoded.endsWith("`"))
      ) {
        decoded = decoded.substring(1, decoded.length - 1).trim();
      }

      // Strip pre-existing math delimiters wrapping the expression
      while (
        (decoded.startsWith('$$') && decoded.endsWith('$$')) ||
        (decoded.startsWith('$') && decoded.endsWith('$')) ||
        (decoded.startsWith('\\[') && decoded.endsWith('\\]')) ||
        (decoded.startsWith('\\(') && decoded.endsWith('\\)'))
      ) {
        if (decoded.startsWith('$$') && decoded.endsWith('$$')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        } else if (decoded.startsWith('$') && decoded.endsWith('$')) {
          decoded = decoded.substring(1, decoded.length - 1).trim();
        } else if (decoded.startsWith('\\[') && decoded.endsWith('\\]')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        } else if (decoded.startsWith('\\(') && decoded.endsWith('\\)')) {
          decoded = decoded.substring(2, decoded.length - 2).trim();
        }
      }

      // Strip any MathType/Equation/OLE prefix wrappers
      decoded = decoded.replace(/^(?:Equation|MathType|OLE|Microsoft Equation|MathType Equation)\s*\d*(?:\s*|:)\s*/i, "").trim();

      const lower = decoded.toLowerCase();
      
      const isBlacklisted = (
        !lower ||
        decoded.includes("[!") ||
        decoded.includes("[img") ||
        decoded.includes("mathtype_") ||
        decoded.includes("formula_") ||
        decoded.includes("_toc") ||
        decoded.includes("_Toc") ||
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
      );

      if (isBlacklisted) return imgTag;

      // Handle underscore strictly (only math subscripts x_1, a_{ij} etc.)
      if (decoded.includes("_")) {
        const parts = decoded.split("_");
        if (parts.length > 2) return imgTag; // Multiple underscores indicate filename/variable
        const left = parts[0].trim();
        const right = parts[1].trim();
        const isLeftSimple = /^[a-zA-Z0-9α-ωΑ-ΩθπΔ]{1,4}$/.test(left);
        const isRightSimple = /^[a-zA-Z0-9α-ωΑ-ΩθπΔ{}]{1,5}$/.test(right);
        if (!isLeftSimple || !isRightSimple) {
          const hasMathIndicator = /\\|\{|\}|\^/.test(decoded);
          if (!hasMathIndicator) {
            return imgTag;
          }
        }
      }

      const hasMathSymbols = /\\|[\+\-\*\/\^_{}\[\]\(\)=<>≤≥≠≈±×÷]/.test(decoded);
      const isVariableName = /^[a-zA-Zα-ωΑ-ΩθπΔ/]$/.test(decoded);
      const isMathExpression = /^[a-zA-Z0-9\sα-ωΑ-ΩθπΔ+\-*/^_{}[\]()=<>≤≥≠≈±×÷]+$/.test(decoded) && 
                               (decoded.includes("=") || decoded.includes("+") || decoded.includes("-") || decoded.includes("*") || decoded.includes("/") || decoded.includes(" ") || decoded.length < 5);
      const hasMathWords = /\b(sin|cos|tan|cot|log|ln|lim|arcsin|arccos|arctan|lg|deg|rad)\b/i.test(decoded);

      if (hasMathSymbols || isVariableName || isMathExpression || hasMathWords) {
        return `$${decoded}$`;
      }
      return imgTag;
    });

    // 0. Preprocess custom offline tags formatting
    processed = processed.replace(/\[!b:\$(.*?)\$\]/g, '<strong>$1</strong>');
    processed = processed.replace(/\[!i:\$(.*?)\$\]/g, '<em>$1</em>');
    processed = processed.replace(/\[!u:\$(.*?)\$\]/g, '<u>$1</u>');
    processed = processed.replace(/\[!sup:\$(.*?)\$\]/g, '<sup>$1</sup>');
    processed = processed.replace(/\[!sub:\$(.*?)\$\]/g, '<sub>$1</sub>');

    // Remove placeholder texts if there's a corresponding image element present in the same block, or style as neat badges
    processed = processed.replace(/\[!m:\$(.*?)\$\]/gi, (match, id) => {
      const hasImage = processed.includes(id) && processed.includes("<img");
      return hasImage ? "" : `<span class="inline-flex items-center px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[11px] font-mono border border-slate-200">Formula (${id})</span>`;
    });

    processed = processed.replace(/\[img:\$(.*?)\$\]/gi, (match, id) => {
      const hasImage = processed.includes(id) && processed.includes("<img");
      return hasImage ? "" : `<span class="inline-flex items-center px-1.5 py-0.5 bg-indigo-50/80 text-indigo-500 rounded text-[11px] font-mono border border-indigo-150">Image (${id})</span>`;
    });
    
    const cleanMathText = (txt: string) => {
      // Strips any HTML tags like <span>, <strong> etc, inside math blocks
      let cleaned = txt
        .replace(/<[^>]+>/g, '')
        .replace(/«\s*Toggle TeX\s*»/gi, "")
        .replace(/»\s*Toggle TeX\s*«/gi, "")
        .replace(/\[\s*Toggle TeX\s*\]/gi, "")
        .replace(/Toggle TeX/gi, "");
      // Decode HTML entities
      cleaned = cleaned
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      return cleaned.trim();
    };

    // 1. Process block math $$...$$
    processed = processed.replace(/\$\$(.+?)\$\$/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return `<div class="katex-block-wrapper my-2 flex justify-center overflow-x-auto w-full">${katex.renderToString(cleaned, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return match;
      }
    });

    // 2. Process inline math $...$
    processed = processed.replace(/\$(.+?)\$/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return katex.renderToString(cleaned, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // 3. Process inline math \( ... \)
    processed = processed.replace(/\\\\\((.+?)\\\\\)/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return katex.renderToString(cleaned, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });
    processed = processed.replace(/\\\((.+?)\\\)/g, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return katex.renderToString(cleaned, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // 4. Process block math \[ ... \]
    processed = processed.replace(/\\\\\[(.+?)\\\\\]/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return `<div class="katex-block-wrapper my-2 flex justify-center overflow-x-auto w-full">${katex.renderToString(cleaned, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return match;
      }
    });
    processed = processed.replace(/\\\[(.+?)\\\]/gs, (match, p1) => {
      try {
        const cleaned = cleanMathText(p1);
        return `<div class="katex-block-wrapper my-2 flex justify-center overflow-x-auto w-full">${katex.renderToString(cleaned, { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return match;
      }
    });

    return processed;
  }, [html]);

  // Check if there are HTML tags inside to decide how to handle rendering
  const isHtml = /<[a-z][\s\S]*>/i.test(renderedContent);
  
  if (!isHtml) {
    // If it's pure text, preserve line breaks
    const formattedText = renderedContent.replace(/\r?\n/g, '<br/>');
    return (
      <div 
        className={`q-content leading-relaxed break-words whitespace-normal text-slate-800 ${className}`} 
        dangerouslySetInnerHTML={{ __html: formattedText }} 
      />
    );
  }

  return (
    <div 
      className={`q-content leading-relaxed break-words whitespace-normal text-slate-800 ${className}`} 
      dangerouslySetInnerHTML={{ __html: renderedContent }} 
    />
  );
};
