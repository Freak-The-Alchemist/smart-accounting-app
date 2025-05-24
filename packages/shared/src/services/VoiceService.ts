// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  swahiliCommand?: string;
  swahiliDescription?: string;
}

export class VoiceService {
  private static instance: VoiceService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private commands: Map<string, VoiceCommand> = new Map();
  private isListening: boolean = false;
  private currentLanguage: 'en-US' | 'sw-KE' = 'en-US';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
        this.registerDefaultCommands();
      }
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      
      // Try to match command in both languages
      const matchedCommand = Array.from(this.commands.values()).find(cmd => 
        command.includes(cmd.command.toLowerCase()) || 
        (cmd.swahiliCommand && command.includes(cmd.swahiliCommand.toLowerCase()))
      );

      if (matchedCommand) {
        const response = this.currentLanguage === 'en-US' 
          ? `Executing ${matchedCommand.description}`
          : `Inatekeleza ${matchedCommand.swahiliDescription || matchedCommand.description}`;
        this.speak(response);
        matchedCommand.action();
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      const errorMessage = this.currentLanguage === 'en-US'
        ? 'Sorry, I encountered an error. Please try again.'
        : 'Samahani, nimekumbana na hitilafu. Tafadhali jaribu tena.';
      this.speak(errorMessage);
    };
  }

  public speak(text: string): void {
    if (!this.synthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    this.synthesis.speak(utterance);
  }

  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.command, command);
  }

  public unregisterCommand(command: string): void {
    this.commands.delete(command);
  }

  public startListening(): void {
    if (!this.recognition || this.isListening) return;

    try {
      this.recognition.start();
      this.isListening = true;
      this.speak('Voice commands activated. How can I help you?');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }

  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      this.isListening = false;
      this.speak('Voice commands deactivated.');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  public isVoiceSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  public getAvailableCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  public setLanguage(language: 'en-US' | 'sw-KE'): void {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public getCurrentLanguage(): 'en-US' | 'sw-KE' {
    return this.currentLanguage;
  }

  private registerDefaultCommands(): void {
    // Basic commands
    this.registerCommand({
      command: 'help',
      swahiliCommand: 'msaada',
      action: () => {
        const helpText = Array.from(this.commands.values())
          .map(cmd => this.currentLanguage === 'en-US'
            ? `${cmd.command}: ${cmd.description}`
            : `${cmd.swahiliCommand || cmd.command}: ${cmd.swahiliDescription || cmd.description}`)
          .join('. ');
        const response = this.currentLanguage === 'en-US'
          ? `Available commands: ${helpText}`
          : `Amri zinazopatikana: ${helpText}`;
        this.speak(response);
      },
      description: 'Show available voice commands',
      swahiliDescription: 'Onyesha amri za sauti zinazopatikana'
    });

    // Document Management Commands
    this.registerCommand({
      command: 'scan receipt',
      swahiliCommand: 'scan risiti',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening receipt scanner. Please position the receipt in view.'
          : 'Inafungua skana ya risiti. Tafadhali weka risiti kwenye eneo la kuona.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:scanReceipt'));
      },
      description: 'Open receipt scanner',
      swahiliDescription: 'Fungua skana ya risiti'
    });

    this.registerCommand({
      command: 'scan invoice',
      swahiliCommand: 'scan ankara',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening invoice scanner. Please position the invoice in view.'
          : 'Inafungua skana ya ankara. Tafadhali weka ankara kwenye eneo la kuona.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:scanInvoice'));
      },
      description: 'Open invoice scanner',
      swahiliDescription: 'Fungua skana ya ankara'
    });

    this.registerCommand({
      command: 'scan statement',
      swahiliCommand: 'scan mshahara',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening statement scanner. Please position the statement in view.'
          : 'Inafungua skana ya mshahara. Tafadhali weka mshahara kwenye eneo la kuona.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:scanStatement'));
      },
      description: 'Open statement scanner',
      swahiliDescription: 'Fungua skana ya mshahara'
    });

    // Quick Entry Commands
    this.registerCommand({
      command: 'add expense',
      swahiliCommand: 'ongeza gharama',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening expense entry form.'
          : 'Inafungua fomu ya kuingiza gharama.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:addExpense'));
      },
      description: 'Open expense entry form',
      swahiliDescription: 'Fungua fomu ya kuingiza gharama'
    });

    this.registerCommand({
      command: 'add income',
      swahiliCommand: 'ongeza mapato',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening income entry form.'
          : 'Inafungua fomu ya kuingiza mapato.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:addIncome'));
      },
      description: 'Open income entry form',
      swahiliDescription: 'Fungua fomu ya kuingiza mapato'
    });

    this.registerCommand({
      command: 'add payment',
      swahiliCommand: 'ongeza malipo',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening payment entry form.'
          : 'Inafungua fomu ya kuingiza malipo.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:addPayment'));
      },
      description: 'Open payment entry form',
      swahiliDescription: 'Fungua fomu ya kuingiza malipo'
    });

    // Report Commands
    this.registerCommand({
      command: 'show reports',
      swahiliCommand: 'onyesha ripoti',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening financial reports dashboard.'
          : 'Inafungua dashibodi ya ripoti za kifedha.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:showReports'));
      },
      description: 'Open financial reports',
      swahiliDescription: 'Fungua ripoti za kifedha'
    });

    this.registerCommand({
      command: 'show balance',
      swahiliCommand: 'onyesha salio',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Calculating current balance.'
          : 'Inakokotoa salio la sasa.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:showBalance'));
      },
      description: 'Show current account balance',
      swahiliDescription: 'Onyesha salio la akaunti la sasa'
    });

    this.registerCommand({
      command: 'show tax summary',
      swahiliCommand: 'onyesha jibu la mwongozo',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Calculating tax summary.'
          : 'Inakokotoa jibu la mwongozo.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:showTaxSummary'));
      },
      description: 'Display tax summary',
      swahiliDescription: 'Onyesha jibu la mwongozo'
    });

    // Search and Filter Commands
    this.registerCommand({
      command: 'find transaction',
      swahiliCommand: 'onaa matokeo',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Opening transaction search. What would you like to search for?'
          : 'Inafungua search ya matokeo. Nini unataka kuhakikisha?';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:searchTransaction'));
      },
      description: 'Search for transactions',
      swahiliDescription: 'Fungua search ya matokeo'
    });

    this.registerCommand({
      command: 'filter by date',
      swahiliCommand: 'weka kwa siku',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Please specify the date range.'
          : 'Tafadhaliweka mwakati wa siku.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:filterByDate'));
      },
      description: 'Filter transactions by date',
      swahiliDescription: 'Weka mwakati wa siku'
    });

    this.registerCommand({
      command: 'filter by category',
      swahiliCommand: 'weka kwa kategoria',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Please specify the category.'
          : 'Tafadhaliweka kategoria.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:filterByCategory'));
      },
      description: 'Filter transactions by category',
      swahiliDescription: 'Weka kategoria'
    });

    // Export and Share Commands
    this.registerCommand({
      command: 'export data',
      swahiliCommand: 'futa data',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Preparing data export. Which format would you prefer?'
          : 'Inafungua data ya fupi. Nini format unataka kutumia?';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:exportData'));
      },
      description: 'Export accounting data',
      swahiliDescription: 'Fungua data ya fupi'
    });

    this.registerCommand({
      command: 'share report',
      swahiliCommand: 'fanya share',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Preparing to share the current report. Who would you like to share it with?'
          : 'Inafungua kutengeneza ripoti ya sasa. Nini kijana unataka kufanya share?';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:shareReport'));
      },
      description: 'Share current report',
      swahiliDescription: 'Fanya share'
    });

    // System Commands
    this.registerCommand({
      command: 'stop',
      swahiliCommand: 'acha',
      action: () => {
        this.stopListening();
        const response = this.currentLanguage === 'en-US'
          ? 'Voice commands deactivated'
          : 'Amri za sauti zimezimwa';
        this.speak(response);
      },
      description: 'Stop voice recognition',
      swahiliDescription: 'Zima utambuzi wa sauti'
    });

    this.registerCommand({
      command: 'clear filters',
      swahiliCommand: 'weka filters',
      action: () => {
        const response = this.currentLanguage === 'en-US'
          ? 'Clearing all filters.'
          : 'Weka filters zote.';
        this.speak(response);
        window.dispatchEvent(new CustomEvent('voice:clearFilters'));
      },
      description: 'Clear all active filters',
      swahiliDescription: 'Weka filters zote'
    });

    this.registerCommand({
      command: 'switch language',
      swahiliCommand: 'badilisha lugha',
      action: () => {
        const newLanguage = this.currentLanguage === 'en-US' ? 'sw-KE' : 'en-US';
        this.setLanguage(newLanguage);
        const response = newLanguage === 'en-US'
          ? 'Switched to English'
          : 'Imegeuka kwa Kiswahili';
        this.speak(response);
      },
      description: 'Switch between English and Swahili',
      swahiliDescription: 'Badilisha kati ya Kiingereza na Kiswahili'
    });
  }
} 