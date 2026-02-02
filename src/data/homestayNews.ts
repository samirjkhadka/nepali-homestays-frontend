/**
 * Curated news and blog entries inspired by Homestay Khabar (https://homestaykhabar.com/)
 * Used for the Blogs & News section on the homepage.
 */

export type NewsItem = {
  id: string;
  title: string;
  titleNe?: string;
  excerpt: string;
  category: string;
  categoryNe?: string;
  date: string;
  /** External link to full article when available */
  url: string;
  /** Optional image URL for card thumbnail */
  imageUrl?: string;
};

export const HOMESTAY_NEWS_SOURCE_URL = 'https://homestaykhabar.com/';

export const HOMESTAY_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Unified homestay workshop in Nawalpur: 300 leaders from Nepal to Sikkim',
    titleNe: 'एकरूप कार्यविधितर्फ होमस्टे : नवलपुरमा राष्ट्रिय कार्यशाला',
    excerpt: 'National workshop on homestay brings together 300 leaders from Nepal and Sikkim for capacity building and best practices.',
    category: 'News',
    categoryNe: 'समाचार',
    date: '2025-01-15',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '2',
    title: 'Simple homestay in Chitwan Shripur: Rural life and organic farming',
    titleNe: 'चितवनको श्रीपुरमा सरल होमस्टे : प्राङ्गारिक खेतीसँगै ग्रामीण जीवनको स्वाद',
    excerpt: 'Experience village life and organic farming at a simple homestay in Shripur, Chitwan. Photo feature on authentic rural hospitality.',
    category: 'Lifestyle',
    categoryNe: 'जीवनशैली',
    date: '2025-01-10',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '3',
    title: 'Maghe Sankranti special program completed',
    titleNe: 'माघेसङ्क्रान्ति विशेष कार्यक्रम सम्पन्न',
    excerpt: 'Maghe Sankranti cultural program and homestay festivities concluded successfully, celebrating tradition and community.',
    category: 'Culture',
    categoryNe: 'संस्कृति',
    date: '2025-01-14',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '4',
    title: 'Homestay Federation national workshop and AGM in Amaltari',
    titleNe: 'अमलटारीमा होमस्टे महासंघको राष्ट्रिय कार्यशाला तथा वार्षिक साधारण सभा',
    excerpt: 'National workshop and annual general meeting of the Homestay Federation to be held in Amaltari, bringing stakeholders together.',
    category: 'News',
    categoryNe: 'समाचार',
    date: '2025-01-08',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '5',
    title: 'Ghorepani Poon Hill: Wonderful trek where sunrise turns the mountains to gold',
    titleNe: 'घोरेपानी पूनहिलको अद्भुत पदयात्रा',
    excerpt: 'The iconic trek to Ghorepani Poon Hill offers stunning sunrise views and homestay experiences along the trail.',
    category: 'Lifestyle',
    categoryNe: 'जीवनशैली',
    date: '2025-01-05',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '6',
    title: 'Bandipur hat bazaar opens: Local produce to market',
    titleNe: 'पालुङटारमा हाट बजार उद्घाटन',
    excerpt: 'Hat bazaar opening in Bandipur connects local farmers and homestay communities with visitors. Photo feature.',
    category: 'Municipality',
    categoryNe: 'पालिका खबर',
    date: '2025-01-03',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '7',
    title: 'Nagarkot community homestay: Nature and culture in one place',
    titleNe: 'नगरकोट सामुदायिक होमस्टे',
    excerpt: 'At 1,531m, Nagarkot community homestay in Bastolagaun offers mountain views and cultural experiences for every traveler.',
    category: 'Culture',
    categoryNe: 'संस्कृति',
    date: '2024-12-28',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '8',
    title: 'Ambukharieni Teej festival: Cultural uplift and community service',
    titleNe: 'आँबुखैरेनीमा वृहत् तीज महोत्सव',
    excerpt: 'Large Teej festival in Ambukharieni combines cultural celebration with homestay tourism and community engagement.',
    category: 'Culture',
    categoryNe: 'संस्कृति',
    date: '2024-12-20',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
  {
    id: '9',
    title: 'Crisis, peace and homestay tourism: Gen Z movement and the country',
    titleNe: 'जेनजी मुभमेन्ट देशमा संकट, शान्ति र होमस्टे पर्यटन',
    excerpt: 'Reflections on youth movement, peace and the role of homestay tourism in building sustainable, community-based travel.',
    category: 'Opinion',
    categoryNe: 'विचार',
    date: '2024-12-15',
    url: HOMESTAY_NEWS_SOURCE_URL,
  },
];
