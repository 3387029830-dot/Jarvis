const markdownLink = /\[([^\]]+)]\([^\s)]+\)/g;
const fencedCode = /```[\s\S]*?```/g;
const inlineCode = /`([^`]+)`/g;
const url = /https?:\/\/\S+/g;
const markdownMarks = /(^|\s)[#>*_~-]+(?=\s)|[*_~]/g;

export function normalizeTextForSpeech(input: string): string {
  return input
    .replace(fencedCode, ' 代码片段 ')
    .replace(markdownLink, '$1')
    .replace(url, ' 链接 ')
    .replace(inlineCode, '$1')
    .replace(markdownMarks, ' ')
    .replace(/([。！？!?；;：:])\1+/g, '$1')
    .replace(/\s+([，。！？；：])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function segmentTextForSpeech(input: string, maximumCharacters = 180): string[] {
  const normalized = normalizeTextForSpeech(input);
  if (!normalized) return [];
  const semantic = normalized.match(/[^。！？!?；;]+[。！？!?；;]?/g) ?? [normalized];
  const result: string[] = [];
  for (const part of semantic) {
    const sentence = part.trim();
    if (!sentence) continue;
    if (sentence.length <= maximumCharacters) result.push(sentence);
    else
      for (let offset = 0; offset < sentence.length; offset += maximumCharacters)
        result.push(sentence.slice(offset, offset + maximumCharacters).trim());
  }
  return result.filter(Boolean);
}
