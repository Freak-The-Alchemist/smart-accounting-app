import { AccountingEntry } from '../types/accounting';

interface ProcessedData {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  currency: string;
}

const CURRENCY = 'KES';
const CURRENCY_SYMBOL = 'KSh';

const SWAHILI_KEYWORDS = {
  income: ['pato', 'mapato', 'ingreso', 'malipo', 'lipwa'],
  expense: ['gharama', 'matumizi', 'tozo', 'ushuru'],
  categories: {
    'fuel': ['mafuta', 'petroli', 'dizeli'],
    'maintenance': ['matengenezo', 'karakana', 'urekebishaji'],
    'utilities': ['umeme', 'maji', 'gesi', 'matumizi'],
    'rent': ['kodi', 'ukodishaji'],
    'salary': ['mshahara', 'malipo', 'mishahara'],
    'supplies': ['vifaa', 'bidhaa', 'hifadhi'],
  }
};

const ENGLISH_KEYWORDS = {
  income: ['paid', 'received', 'income', 'payment', 'revenue'],
  expense: ['expense', 'cost', 'payment', 'bill'],
  categories: {
    'fuel': ['fuel', 'gas', 'petrol', 'diesel'],
    'maintenance': ['maintenance', 'repair', 'service'],
    'utilities': ['electricity', 'water', 'gas', 'utility'],
    'rent': ['rent', 'lease'],
    'salary': ['salary', 'wage', 'payroll'],
    'supplies': ['supplies', 'inventory', 'stock'],
  }
};

function detectLanguage(text: string): 'sw' | 'en' {
  const swahiliWords = [
    ...SWAHILI_KEYWORDS.income,
    ...SWAHILI_KEYWORDS.expense,
    ...Object.values(SWAHILI_KEYWORDS.categories).flat()
  ];
  
  const swahiliMatchCount = swahiliWords.filter(word => 
    text.toLowerCase().includes(word.toLowerCase())
  ).length;
  
  return swahiliMatchCount > 0 ? 'sw' : 'en';
}

function getKeywords(language: 'sw' | 'en') {
  return language === 'sw' ? SWAHILI_KEYWORDS : ENGLISH_KEYWORDS;
}

export async function processOCRText(text: string): Promise<ProcessedData> {
  const language = detectLanguage(text);
  const keywords = getKeywords(language);

  // Extract amount using regex (supports KES format)
  const amountMatch = text.match(/(?:KSh|KES)?\s*\d+(?:,\d{3})*(?:\.\d{2})?/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[KShKES,\s]/g, '')) : 0;

  // Extract date using regex (supports multiple formats)
  const dateMatch = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);
  const date = dateMatch ? new Date(dateMatch[0]) : new Date();

  // Determine if it's income or expense based on keywords
  const type = keywords.income.some(keyword => text.toLowerCase().includes(keyword))
    ? 'income'
    : 'expense';

  // Extract category based on keywords
  let category = 'uncategorized';
  for (const [cat, catKeywords] of Object.entries(keywords.categories)) {
    if (catKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      category = cat;
      break;
    }
  }

  return {
    amount,
    description: text.trim(),
    category,
    type,
    date,
    currency: CURRENCY,
  };
}

export async function processVoiceText(text: string): Promise<ProcessedData> {
  const language = detectLanguage(text);
  const keywords = getKeywords(language);
  
  // Similar processing as OCR, but with voice-specific adjustments
  const processedData = await processOCRText(text);

  // Additional voice-specific processing
  const todayKeywords = language === 'sw' ? ['leo'] : ['today'];
  const yesterdayKeywords = language === 'sw' ? ['jana'] : ['yesterday'];
  
  if (todayKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
    processedData.date = new Date();
  } else if (yesterdayKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    processedData.date = yesterday;
  }

  return processedData;
}

export function createAccountingEntry(
  processedData: ProcessedData,
  userId: string,
  sector: 'general' | 'fuel' = 'general'
): Omit<AccountingEntry, 'id'> {
  return {
    ...processedData,
    status: 'pending',
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
} 