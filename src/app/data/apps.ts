export type AppCategory =
  | 'all'
  | 'social'
  | 'banking'
  | 'entertainment'
  | 'education'
  | 'books'
  | 'games'
  | 'other';

export interface AppEntry {
  id: string;
  name: string;
  color: string;
  categories: AppCategory[];
}

const C = (c: AppCategory[]): AppCategory[] => ['all', ...c];

export const APPS: AppEntry[] = [
  { id: 'facebook', name: 'facebook', color: '#1877F2', categories: C(['social']) },
  { id: 'microsoft', name: 'Microsoft', color: '#5E5E5E', categories: C(['education']) },
  { id: 'apple', name: 'Apple', color: '#000000', categories: C([]) },
  { id: 'google', name: 'Google', color: '#4285F4', categories: C(['education']) },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', categories: C(['entertainment']) },
  { id: 'netflix', name: 'NETFLIX', color: '#E50914', categories: C(['entertainment']) },
  { id: 'x', name: 'X', color: '#000000', categories: C(['social']) },
  { id: 'farmville', name: 'FarmVille 2', color: '#E0AF24', categories: C(['games']) },
  { id: 'line', name: 'LINE@', color: '#06C755', categories: C(['social']) },
  { id: 'gmail', name: 'Gmail', color: '#EA4335', categories: C(['social', 'education']) },
  { id: 'instagram', name: 'Instagram', color: '#E1306C', categories: C(['social']) },
  { id: 'valorant', name: 'VALORANT', color: '#FA4454', categories: C(['games']) },
  { id: 'messenger', name: 'Messenger', color: '#0084FF', categories: C(['social']) },
  { id: 'kplus', name: 'K PLUS', color: '#0CAA40', categories: C(['banking']) },
  { id: 'tiktok', name: 'TikTok', color: '#000000', categories: C(['social']) },
  { id: 'discord', name: 'Discord', color: '#5865F2', categories: C(['social']) },
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', categories: C(['social']) },
  { id: 'threads', name: 'Threads', color: '#000000', categories: C(['social']) },
  { id: 'wechat', name: 'WeChat', color: '#1AAD19', categories: C(['social']) },
  { id: 'kakaotalk', name: 'KakaoTalk', color: '#FAE100', categories: C(['social']) },
  { id: 'bluesky', name: 'Bluesky', color: '#1185FE', categories: C(['social']) },
  { id: 'weibo', name: 'Weibo', color: '#E6162D', categories: C(['social']) },
  { id: 'scb', name: 'SCB', color: '#4B286D', categories: C(['banking']) },
  { id: 'gsb', name: 'MyMo (GSB)', color: '#E91E63', categories: C(['banking']) },
  { id: 'truemoney', name: 'TrueMoney', color: '#F37021', categories: C(['banking']) },
  { id: 'krungsri', name: 'Krungsri', color: '#FFC107', categories: C(['banking']) },
  { id: 'bualuang', name: 'Bualuang', color: '#1565C0', categories: C(['banking']) },
  { id: 'krungthai', name: 'Krungthai', color: '#00ADEF', categories: C(['banking']) },
  { id: 'kbank', name: 'KBank Old', color: '#0E823F', categories: C(['banking']) },
  { id: 'shopee', name: 'Shopee', color: '#EE4D2D', categories: C(['banking']) },
  { id: 'lazada', name: 'Lazada', color: '#FF6F00', categories: C(['banking']) },
  { id: 'amazon', name: 'amazon', color: '#FF9900', categories: C(['banking']) },
  { id: 'classroom', name: 'Classroom', color: '#1A73E8', categories: C(['education']) },
  { id: 'chatgpt', name: 'ChatGPT', color: '#10A37F', categories: C(['education']) },
  { id: 'meet', name: 'Google Meet', color: '#00897B', categories: C(['education']) },
  { id: 'webex', name: 'Webex', color: '#00BCEB', categories: C(['education']) },
  { id: 'msureg', name: 'MSU REG', color: '#FFC107', categories: C(['education']) },
  { id: 'ebay', name: 'ebay', color: '#E53238', categories: C(['books']) },
  { id: 'kaidee', name: 'kaidee', color: '#172755', categories: C(['books']) },
  { id: 'a-novel', name: 'A', color: '#1ABC9C', categories: C(['books']) },
  { id: 'joylada', name: 'Joylada', color: '#E91E63', categories: C(['books']) },
  { id: 'bookdose', name: 'B', color: '#E91E63', categories: C(['books']) },
  { id: 'lezhin', name: 'LEZHIN', color: '#C73B3B', categories: C(['books']) },
  { id: 'rookie', name: 'Rookie', color: '#2E8B57', categories: C(['books']) },
  { id: 'wecomics', name: 'wecomics', color: '#FF7B54', categories: C(['books']) },
  { id: 'webtoon', name: 'WEBTOON', color: '#00DC64', categories: C(['books']) },
  { id: 'fic', name: 'fic', color: '#F5A623', categories: C(['books']) },
  { id: 'pikkasub', name: 'พิกซับ', color: '#FCBA77', categories: C(['books']) },
  { id: 'arcanum', name: 'A-game', color: '#F58220', categories: C(['games']) },
  { id: 'garena', name: 'Garena', color: '#C30E0E', categories: C(['games']) },
  { id: 'steam', name: 'Steam', color: '#1B2838', categories: C(['games']) },
  { id: 'rok', name: 'ROK', color: '#222222', categories: C(['games']) },
  { id: 'pubg', name: 'PUBG', color: '#F1B41B', categories: C(['games']) },
  { id: 'freefire', name: 'FREE FIRE', color: '#F77E0B', categories: C(['games']) },
  { id: 'gta', name: 'GTA', color: '#222222', categories: C(['games']) },
  { id: 'roblox', name: 'Roblox', color: '#000000', categories: C(['games']) },
];

export const CATEGORIES: { id: AppCategory; label: string }[] = [
  { id: 'all', label: 'แอพลิเคชั่นทั้งหมด' },
  { id: 'social', label: 'สื่อสังคมออนไลน์' },
  { id: 'banking', label: 'ธุรกรรม' },
  { id: 'entertainment', label: 'ความบันเทิง' },
  { id: 'education', label: 'การศึกษา' },
  { id: 'books', label: 'หนังสือ' },
  { id: 'games', label: 'เกม' },
  { id: 'other', label: 'อื่นๆ' },
];

export function appsByCategory(cat: AppCategory): AppEntry[] {
  if (cat === 'all') return APPS.filter((a) => a.categories.includes('all'));
  if (cat === 'other') return [];
  return APPS.filter((a) => a.categories.includes(cat));
}
