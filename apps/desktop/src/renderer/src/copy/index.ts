import { zhCN } from './zh-CN';
import type { ProductCopy, SupportedLocale } from './types';

export const productCopy = {
  'zh-CN': zhCN,
} satisfies Record<SupportedLocale, ProductCopy>;

export const copy = productCopy['zh-CN'];

export type { ProductCopy, SupportedLocale } from './types';
