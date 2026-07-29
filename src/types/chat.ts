export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  model?: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: string;
}

export interface CodeArtifact {
  id: string;
  title: string;
  language: string;
  code: string;
}

export const OPENROUTER_MODELS: ModelOption[] = [
  {
    id: 'inclusionai/ling-3.0-flash:free',
    name: 'Ling 3.0 Flash',
    provider: 'Inclusion AI',
    description: 'Sangat cepat, halus, & efisien untuk percakapan dan coding.',
    badge: 'Default (Fastest)',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'Nemotron-3 Ultra 550B',
    provider: 'NVIDIA',
    description: 'Model ultra-besar 550B untuk penalaran mendalam & analisis kompleks.',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron-3 Super 120B',
    provider: 'NVIDIA',
    description: 'Performa seimbang 120B untuk tugas umum dan pemrosesan instruksi.',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'North Mini Code',
    provider: 'Cohere',
    description: 'Dioptimalkan khusus untuk coding, sintaksis program, dan live preview.',
  },
];
