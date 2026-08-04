export interface Track {
  id: string;
  title: string;
  duration: string; // "mm:ss"
  durationSec: number;
}

export interface Album {
  id: string;
  name: string;
  deity: string;
  description: string;
  trackCount: number;
  coverGradient: [string, string];
  symbol: string;
  tracks: Track[];
}

export const ALBUMS: Album[] = [
  {
    id: 'vishnu',
    name: 'Vishnu Collection',
    deity: 'Lord Vishnu',
    description: 'Sacred hymns dedicated to the Preserver of the Universe.',
    trackCount: 8,
    coverGradient: ['#0D2B4E', '#1A5276'],
    symbol: '🔱',
    tracks: [
      { id: 'v1', title: 'Vishnu Sahasranamam', duration: '18:24', durationSec: 1104 },
      { id: 'v2', title: 'Om Namo Narayanaya', duration: '8:12', durationSec: 492 },
      { id: 'v3', title: 'Narayana Kavacham', duration: '12:05', durationSec: 725 },
      { id: 'v4', title: 'Vishnu Ashtakam', duration: '6:30', durationSec: 390 },
      { id: 'v5', title: 'Achyutam Keshavam', duration: '5:45', durationSec: 345 },
      { id: 'v6', title: 'Madhurashtakam', duration: '4:20', durationSec: 260 },
      { id: 'v7', title: 'Dashavatara Stotram', duration: '9:15', durationSec: 555 },
      { id: 'v8', title: 'Vaikunta Ekadasi Hymn', duration: '7:00', durationSec: 420 },
    ],
  },
  {
    id: 'shiva',
    name: 'Shiva Collection',
    deity: 'Lord Shiva',
    description: 'Powerful chants invoking the grace of Mahadeva.',
    trackCount: 7,
    coverGradient: ['#1A0A2E', '#4A235A'],
    symbol: '🕉️',
    tracks: [
      { id: 's1', title: 'Shiva Tandava Stotram', duration: '7:48', durationSec: 468 },
      { id: 's2', title: 'Om Namah Shivaya', duration: '11:00', durationSec: 660 },
      { id: 's3', title: 'Maha Mrityunjaya Mantra', duration: '9:30', durationSec: 570 },
      { id: 's4', title: 'Shiva Ashtakam', duration: '5:20', durationSec: 320 },
      { id: 's5', title: 'Lingashtakam', duration: '4:55', durationSec: 295 },
      { id: 's6', title: 'Bilvashtakam', duration: '6:10', durationSec: 370 },
      { id: 's7', title: 'Rudrashtakam', duration: '8:00', durationSec: 480 },
    ],
  },
  {
    id: 'lakshmi',
    name: 'Lakshmi Collection',
    deity: 'Goddess Lakshmi',
    description: 'Devotional hymns for abundance, grace and prosperity.',
    trackCount: 6,
    coverGradient: ['#2D1B00', '#7D5A00'],
    symbol: '🪷',
    tracks: [
      { id: 'l1', title: 'Sri Lakshmi Ashtottaram', duration: '14:20', durationSec: 860 },
      { id: 'l2', title: 'Kanakadhara Stotram', duration: '8:45', durationSec: 525 },
      { id: 'l3', title: 'Mahalakshmi Ashtakam', duration: '5:30', durationSec: 330 },
      { id: 'l4', title: 'Sri Suktam', duration: '10:00', durationSec: 600 },
      { id: 'l5', title: 'Lakshmi Gayatri', duration: '6:15', durationSec: 375 },
      { id: 'l6', title: 'Vaibhava Lakshmi Vrat', duration: '12:00', durationSec: 720 },
    ],
  },
  {
    id: 'hanuman',
    name: 'Hanuman Collection',
    deity: 'Lord Hanuman',
    description: 'Chants of courage, devotion and divine strength.',
    trackCount: 6,
    coverGradient: ['#2E0A00', '#7A2800'],
    symbol: '🙏',
    tracks: [
      { id: 'h1', title: 'Hanuman Chalisa', duration: '9:12', durationSec: 552 },
      { id: 'h2', title: 'Bajrang Baan', duration: '11:30', durationSec: 690 },
      { id: 'h3', title: 'Hanuman Ashtakam', duration: '5:00', durationSec: 300 },
      { id: 'h4', title: 'Sankat Mochan', duration: '7:20', durationSec: 440 },
      { id: 'h5', title: 'Maruti Stotram', duration: '4:45', durationSec: 285 },
      { id: 'h6', title: 'Anjaneya Dandakam', duration: '6:00', durationSec: 360 },
    ],
  },
  {
    id: 'krishna',
    name: 'Krishna Collection',
    deity: 'Lord Krishna',
    description: 'Blissful bhajans and hymns of the divine flute player.',
    trackCount: 7,
    coverGradient: ['#001A2E', '#003D6B'],
    symbol: '🎵',
    tracks: [
      { id: 'k1', title: 'Hare Krishna Mahamantra', duration: '16:00', durationSec: 960 },
      { id: 'k2', title: 'Govinda Ashtakam', duration: '6:30', durationSec: 390 },
      { id: 'k3', title: 'Madhurashtakam', duration: '5:15', durationSec: 315 },
      { id: 'k4', title: 'Damodarashtakam', duration: '7:00', durationSec: 420 },
      { id: 'k5', title: 'Radha Krishna Bhajan', duration: '8:20', durationSec: 500 },
      { id: 'k6', title: 'Gopala Gopala', duration: '4:50', durationSec: 290 },
      { id: 'k7', title: 'Yashomati Maiya', duration: '5:30', durationSec: 330 },
    ],
  },
  {
    id: 'ganesha',
    name: 'Ganesha Collection',
    deity: 'Lord Ganesha',
    description: 'Auspicious chants to remove obstacles and invite blessings.',
    trackCount: 5,
    coverGradient: ['#1A0D00', '#5C3300'],
    symbol: '🐘',
    tracks: [
      { id: 'g1', title: 'Ganesha Pancharatnam', duration: '7:15', durationSec: 435 },
      { id: 'g2', title: 'Vakratunda Mahakaya', duration: '4:00', durationSec: 240 },
      { id: 'g3', title: 'Ganapati Atharvashirsha', duration: '12:30', durationSec: 750 },
      { id: 'g4', title: 'Ganesha Ashtakam', duration: '5:45', durationSec: 345 },
      { id: 'g5', title: 'Siddhivinayak Stotra', duration: '6:20', durationSec: 380 },
    ],
  },
  {
    id: 'durga',
    name: 'Durga Collection',
    deity: 'Goddess Durga',
    description: 'Fierce and protective hymns of the Divine Mother.',
    trackCount: 6,
    coverGradient: ['#2E0010', '#7A0030'],
    symbol: '⚔️',
    tracks: [
      { id: 'd1', title: 'Durga Saptashati', duration: '22:00', durationSec: 1320 },
      { id: 'd2', title: 'Mahishasura Mardini', duration: '9:45', durationSec: 585 },
      { id: 'd3', title: 'Durga Ashtakam', duration: '5:30', durationSec: 330 },
      { id: 'd4', title: 'Devi Kavacham', duration: '8:00', durationSec: 480 },
      { id: 'd5', title: 'Argala Stotram', duration: '6:15', durationSec: 375 },
      { id: 'd6', title: 'Navarna Mantra', duration: '7:30', durationSec: 450 },
    ],
  },
  {
    id: 'gita',
    name: 'Bhagavad Gita',
    deity: 'Lord Krishna',
    description: 'Complete recitation of the 18 chapters of the Gita.',
    trackCount: 8,
    coverGradient: ['#0A1A0A', '#1A4A1A'],
    symbol: '📖',
    tracks: [
      { id: 'bg1', title: 'Chapter 1 — Arjuna Vishada', duration: '14:20', durationSec: 860 },
      { id: 'bg2', title: 'Chapter 2 — Sankhya Yoga', duration: '18:45', durationSec: 1125 },
      { id: 'bg3', title: 'Chapter 3 — Karma Yoga', duration: '12:30', durationSec: 750 },
      { id: 'bg4', title: 'Chapter 4 — Jnana Yoga', duration: '11:00', durationSec: 660 },
      { id: 'bg5', title: 'Chapter 5 — Karma Sanyasa', duration: '9:15', durationSec: 555 },
      { id: 'bg6', title: 'Chapter 6 — Dhyana Yoga', duration: '13:00', durationSec: 780 },
      { id: 'bg7', title: 'Chapter 12 — Bhakti Yoga', duration: '7:30', durationSec: 450 },
      { id: 'bg8', title: 'Chapter 18 — Moksha Yoga', duration: '22:00', durationSec: 1320 },
    ],
  },
];
