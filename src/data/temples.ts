import { Temple, SpiritualEvent, EmotionHealingCategory } from '../types';
import { GITA_VERSES } from './scriptures';

export const TEMPLES_DATA: Temple[] = [
  {
    id: 'someshwara',
    name: 'Sri Someshwara Swamy',
    distance: '2.4 km',
    location: 'Bangalore',
    rating: 4.8,
    reviewsCount: '1.2k',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5Ex4Mi9gbikTSRjeg9reKGxnewTTs6XhTgGWndDf9MClzujUzaD8QKkjtABnxqn9oE8bxFcaotSb-rcJpj_lKcPtG4kAjmDZ1koZwWrfY7iOZhX3vH2Py-u-3sU_hVMPSUVNiz8ejcg0woNZ6flk4sUcqu7KKhGjNBrz_PKPng87FsZ7MnBZHp65L0oKRuiT3n05BA8RGlEHuHa9-vEolRZh6j5-fs5_2MgnhtFyuyRqqo76GuyeLRKsfOqcdEzSWpNavGBPmebk',
    altText: 'Majestic South Indian temple at dusk',
    timing: '6:00 AM - 12:30 PM, 5:30 PM - 9:00 PM',
    deity: 'Lord Shiva',
    description: 'An ancient Chola era sanctuary dedicated to Lord Someshwara, boasting grand carved pillars and serene courtyard pools.'
  },
  {
    id: 'iskcon',
    name: 'ISKCON Temple',
    distance: '4.1 km',
    location: 'Rajajinagar, Bangalore',
    rating: 4.9,
    reviewsCount: '4.5k',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSxMmg56AEgR4RhB9ImVxM2RanDTXxScGVUvaDgFpEzjJvSA1dSxD12kGDign0g1P2GfZQR5X8qykHLc242XuSmL-OzSDFT1TVgcCR6-AVkupseDkY2zZCpjJeIxAx8jKD-4Q-_jm2VBNAL3J0d8zWgWm8XESKzaDBg3pYs6xPP0TDeLtqNxBHYD3zrQfOWbbPwThziBcFwAIVqNCHONZp-z3xUhnmUYF_xUSYuycQxWBClFy3R-7w5dW-NLgjBZZ8ODsVsToqDoU',
    altText: 'Serene temple complex morning mist',
    timing: '4:15 AM - 5:00 AM, 7:15 AM - 1:00 PM, 4:00 PM - 8:20 PM',
    deity: 'Sri Sri Radha Krishnachandra',
    description: 'A breathtaking neo-classical Vedic temple atop Hare Krishna Hill, renowned for soulful kirtans and tranquil water fountains.'
  },
  {
    id: 'bull-temple',
    name: 'Bull Temple (Dodda Basavana Gudi)',
    distance: '3.4 km',
    location: 'Basavanagudi, Bangalore',
    rating: 4.7,
    reviewsCount: '3.1k',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBehKKAV-zeSNdYbyGxl48qqUqSBplovEhT5jr9D6YfVHEmf8pO2jk-ZR9wapJiQuW7MkGQroKcuEjg-Q72MYzKUJcDs7AgbhIM-aECrRA8SynUiW1aKIsHXGT1okNqUdqLp18BhoRdsRO9kqoXiUNgQJKH0f75LgCOVuwccbaTEzJSWuv9csMfue8ViL8YV9WnQvtyDXy5JTkA6wi9Vwmd7D2SulQc18Xa3hzVsrSAMJLRUe2py0P-VwQ6JEyMCbxGAHEigREIT5E',
    altText: 'Close up detail of the majestic Nandi bull statue at the Bull Temple in Bangalore',
    timing: '6:00 AM - 8:00 PM',
    deity: 'Sacred Nandi',
    description: 'Houses a massive monolithic granite sculpture of Nandi carved from a single boulder, surrounded by lush Bugle Rock gardens.'
  },
  {
    id: 'gavi-gangadhareshwara',
    name: 'Gavi Gangadhareshwara',
    distance: '4.2 km',
    location: 'Gavipuram, Bangalore',
    rating: 4.8,
    reviewsCount: '2.8k',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIe_9qahABKyaA_SQh3CVhRZEYPP1_mZy74jBiFc5toMCmrehtVTFAVKuWe01K2tvMGmi-gcdN66v3KSN9jlQo1wrYdDmJi8vUwVlKl8FWD4Cjq7F2w9BNhbx_A1BarPDONFdQPKxmmdUQ2vZgIAWiFRUeO7gm_M7NgkWZk8qZdc1RGJi3i7t3BB3OOuJzDhYrjXlv-SwTFjvOd53YSuNn_W6SmGMAZFx-HdCbDwyxWeXFS6fpDE-hpEd8mx_NO1Z0Xn1dUZQ0q4g',
    altText: 'Exterior view of the cave entrance at Gavi Gangadhareshwara Temple',
    timing: '6:00 AM - 12:30 PM, 6:00 PM - 8:00 PM',
    deity: 'Lord Shiva',
    description: 'Famous 9th-century cave temple carved out of a natural rock formation, renowned for its astronomical alignment during Makara Sankranti.'
  },
  {
    id: 'dharmaraya-swamy',
    name: 'Dharmaraya Swamy Temple',
    distance: '5.6 km',
    location: 'Nagarathpete, Bangalore',
    rating: 4.6,
    reviewsCount: '1.9k',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt0arer6jNB38RIkvkSpAWpawOulcy3jtDhJEv86S5EuAlLHve0IozPA93vfvwxErOl_DrnAPsNemdO3mQCrrx79SHOwqGW60bDp6ZWO-_X5DthoSDaef4MllpsuUBhZa9b0d1TgkYgZ0P_sxqkNIBwsecZFkbMPD8D36qbZgyljTFOzh8ALnxcC1AJT9hRYsSGgunIa_ia1mIzmThvtPP_BEBISIgZrY9kbjTbWaYjJdPjI9jiP2X1dkiu6QqeIMSwdZQWn7cAuQ',
    altText: 'Perspective shot of the towering gopuram of Dharmaraya Swamy Temple',
    timing: '6:30 AM - 11:30 AM, 5:30 PM - 8:30 PM',
    deity: 'Pandavas & Draupadi',
    description: 'Unique historical temple dedicated to the Pandavas and Draupadi, central home to Bangalore’s centuries-old Karaga Shaktyotsava festival.'
  }
];

export const SPIRITUAL_EVENTS: SpiritualEvent[] = [
  {
    id: 'evt-1',
    title: 'Bhagavad Gita Chanting',
    month: 'MAY',
    day: 15,
    time: '6:30 PM • Main Hall',
    location: 'Sri Someshwara Sanctuary',
    attendeesCount: 42,
    rsvp: true
  },
  {
    id: 'evt-2',
    title: 'Ekadashi Satsang & Kirtan',
    month: 'MAY',
    day: 19,
    time: '5:00 PM • Temple Garden',
    location: 'ISKCON Courtyard',
    attendeesCount: 88,
    rsvp: false
  },
  {
    id: 'evt-3',
    title: 'Vedic Meditation & Pranayama Workshop',
    month: 'MAY',
    day: 24,
    time: '7:00 AM • Meditation Hall',
    location: 'SANATANA Sanctum',
    attendeesCount: 35,
    rsvp: false
  }
];

export const EMOTION_HEALING_CATEGORIES: EmotionHealingCategory[] = [
  {
    id: 'anger',
    title: 'Anger',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEFSY0xuzIBjaVpyF01jakgvrOmmdiW5HU8eDswlcf9P962lD5xz96ugqeg1FIdpbI_vMVtSM5oe0eOIY4skNZSeLNk1tzlG7d_zJgWtyXTDkhE6REuKMWsCstuv3ZRVOZrWEIOofv4d4U1b5q-q2l6NNW7VzHgikd6y2I8wLpJ0Hst6M2Rqibz409w8FZaF5HBPzfRJzCkMbHv7Pbu0z_wXz13-eUv1rz29Xf6sFzOfw6p6kCb0V2zGvDNUB5M3TWkIcapJPCFyg',
    shlokas: [GITA_VERSES[0]],
    comfortMessage: 'Anger is the result of unfulfilled desires. When we control our desires, we automatically overcome anger.'
  },
  {
    id: 'anxiety',
    title: 'Anxiety',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOYmCSHWzCQNKnSaLt_34nUb-o3tA1kKqA0s0CYsAkNUwGwCfJYnX6u7VkwSua19URtoqpWU3kBR5PXQ4uUxXXbPuFoEbml0K20pbIngCkvHCJXtJ_f8cegC7aWFI_kgCtBG824Uqga-HnwB7jsv02m4SchVAdjlb7GjvWA2QNC8VU9bXZNy7jKJUOJTDKZmIRgv6r5_8sQ37zd1TuPeYJ8UJcy4W9Opd-9xW1UkY3kQ8X57Tj0PJ2WqLox_7bkcul7eRwBSNIiic',
    shlokas: [GITA_VERSES[3], GITA_VERSES[4]],
    comfortMessage: 'Anxiety stems from attachment to unwritten futures. Anchor yourself in the unchanging present moment through conscious breath and selfless action.'
  },
  {
    id: 'stress',
    title: 'Stress',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB44iUdZOfMN0jPoet21u6zeAtsPThwmYP0urGc62_0necbVW4FTDY6MptbcoLocgC-vubSaMA-CM0VcpVAsgn4L1AHqy4lBpoNm-prWeDJQaHxeHDFd8ujZyVuEIONPT0s5ln4lrZDVYzyIiOaMYwwuybexFXlzVEpuTPU01CUNUNz_Z2UOo1m9f8NWpKU4G72zilBaskjbIudiLvFXe6pke6_60e0crjfR6eDqx14-ifKHzGp7JKn3k7ZJzX2CnHabd-xo62upuE',
    shlokas: [GITA_VERSES[3], GITA_VERSES[0]],
    comfortMessage: 'Stress arises when we try to control outcomes. Do your best, then release the burden to the Universe.'
  },
  {
    id: 'fear',
    title: 'Fear',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFwnEFRRSawmrb2cnryN9I4q5VcjDBA8I0MCkU8rNW8M_g355Dy44rrmRaXmi6jYq5-_bFP8m_V0tqEdQz7-BmiI6OwDa2JZc5FN4swf4y0Yz2Udtzq6Q0R0USurwIVLhcZYHT_Jjw9G7y0TqERUO_O5_m6aPvCKQ58CgWF9McCPKy5gs8cR0Z86l8C6-sYXVoNLTlsvQTnLfPS-WkMGgLr8UxPFk46lC13dPhgSP3mLoCrnr9C_1TlM-Te4LofHzZDbgjTotwJTk',
    shlokas: [GITA_VERSES[0], GITA_VERSES[1]],
    comfortMessage: 'The eternal soul cannot be destroyed by weapons, nor burned by fire. You are timeless strength itself.'
  },
  {
    id: 'loneliness',
    title: 'Loneliness',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYlLQedRJxB2VeVn6qzh_zEQnJc0JdRugwzqanvLOFyawRv1MNUSa_A7paO-yXjBrPb8sEglieOdboEHnOBnCfe1L6bwdU_3TuCkSVD3bI9NvSD-7es64dSzmUFhQWA8nf4whkB9W2kdXtfUSshCbIlaKYvur1gPGdqDMb92Tfkr5NWUomGucWAbAWJ57dJSAAyrfLoGgdo_R83vbBs9h8p8TiWMrT9ZI-pNW22HdvxSL72ZDuydcgrpuhOY2yiNUkzms6da7zS4',
    shlokas: [GITA_VERSES[1], GITA_VERSES[4]],
    comfortMessage: 'You are never truly alone. The divine presence resides in the quiet sanctuary of your heart at every breath.'
  }
];
