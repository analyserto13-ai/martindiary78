export type PriorityLevel = 'low' | 'medium' | 'high';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string; // ISO date string
  priority: PriorityLevel;
  photos: string[]; // URIs
  links: string[]; // URLs
  reminderDate: string | null; // ISO datetime string or null
  audioUri: string | null; // URI of recorded audio file
  createdAt: string;
  updatedAt: string;
}

export type RootStackParamList = {
  Lock: undefined;
  Home: undefined;
  NewEntry: { entryId?: string } | undefined;
  EntryDetail: { entryId: string };
  Settings: undefined;
};