export interface Quote {
  text: string;
  audioUrl: string;
}

export interface Category {
  name: string;
  quotes: Quote[];
}

export interface Section {
  name: string;
  categories: Category[];
}

export interface Civilization {
  displayName: string;
  sections: Section[];
}

export interface QuotationsData {
  civilizations: Record<string, Civilization>;
}

export interface RecommendedSound {
  text: string;
  audioUrl: string;
  unit: string;
  category: string;
}

export interface Hook {
  name: string;
  description: string;
  recommendations: RecommendedSound[];
}

export interface RecommendedSetup {
  hooks: Hook[];
}
