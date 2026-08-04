export interface EmotionDetail {
  id: string;
  title: string;
  tagline: string;
  heroImage: string;
  sanskrit: string;
  reference: string;
  transliteration: string;
  translation: string;
  silhouetteImage: string;
  whatItMeans: string;
  meansImage: string;
  exampleText: string;
  exampleImage: string;
  actions: {
    title: string;
    sub: string;
    badge?: string;
    iconUrl?: string;
  }[];
  mantraSanskrit: string;
  mantraTransliteration: string;
  mantraMeaning: string;
  bellImage: string;
}

export const EMOTIONS_DATA: Record<string, EmotionDetail> = {
  anger: {
    id: 'anger',
    title: 'Anger',
    tagline: 'Transform Your Energy',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBEFSY0xuzIBjaVpyF01jakgvrOmmdiW5HU8eDswlcf9P962lD5xz96ugqeg1FIdpbI_vMVtSM5oe0eOIY4skNZSeLNk1tzlG7d_zJgWtyXTDkhE6REuKMWsCstuv3ZRVOZrWEIOofv4d4U1b5q-q2l6NNW7VzHgikd6y2I8wLpJ0Hst6M2Rqibz409w8FZaF5HBPzfRJzCkMbHv7Pbu0z_wXz13-eUv1rz29Xf6sFzOfw6p6kCb0V2zGvDNUB5M3TWkIcapJPCFyg',
    sanskrit:
      'ध्यायतो विषयान्पुंस: सङ्गस्तेषूपजायते ।\nसङ्गात् संजायते काम: कामात्क्रोधोऽभिजायते ॥',
    reference: '— Bhagavad Gita 2.62',
    transliteration:
      "dhyaayato visayan pumsah sangas tesupajayate |\nsangat sanjayate kamah kaamat krodho 'bhijayate ||",
    translation:
      'Thinking of sense objects creates attachment, from attachment arises desire, from desire arises anger.',
    silhouetteImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnKIgFlVqBhB11y4opyXxU57koxao_X7oK8lfg3cggmZIfW1Fr0dOrjGnERkoavofd2KbWRoR3-JLfpcNev80PbKLblvYINR8XZWTbR2iSHvg0woAYxPWnv70PZRQtvGJhJSDN2pim1hJs0KGWOXrT9tq3nAev5oFpkwEetcneIhOT_OC3XkPf4HLSNZeuPlKQQwZjpTalUL6PokfkJaN-wti-dNfFapD2S69-EK3P2RVMycR0AwhtR7lVl5jeFdFBWlcVCVuFhE',
    whatItMeans:
      'Anger is the result of unfulfilled desires. When we control our desires, we automatically overcome anger.',
    meansImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYyfv2b8aMAMQfAuxvXk_tcrdbZTrWiiI05D1kYuVUSdtdFbqDYX6T-zMqFqAacGPZeQuU6mwpfJBMya5bca8z1BIJlOl0w1SDzqrHmFOtULh1Oawg7WcqtB94ElZNcHl2lYXNXyRae-jDWt0KnbaZWKCxMTK2PjfOROarawYvF9HBYfocMMmAUKKIe-UddjyEhj5HeuH_IV2vNMOV2uHhai08XEHXPeNlpCAUGMBEs0y5KgQlG6fecnOF0Ll-UgDo8RYRKqszyb8',
    exampleText:
      'When the river flows freely, it nourishes fields. When blocked, it floods. Channel your energy in the right direction.',
    exampleImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIlgWcBWRjZaOKiSXwBcxlWLr-0eVfNRSXRF5DV-0PPQeCDpuXVRFZfqp_-AUEtwZEZDL4oykD38UIumWPb6C8yQBOEbQ3L30M_fV5AKZc9i3fD4UYx1-FH5-netJF9tTua3mNIuoBRu8bO98U_2BhPEI2w0qMI4zCI6t6pxK0L6wIHCSlpZLgrSbWeaYPw-qMJzZYkvyx0oN8p8ggTa5j-S8KInXbAundCW2bxSzvIVpnlj1MURaj0kpHx24v5dB3qi0JQVwcmJ8',
    actions: [
      {
        title: 'Pause &',
        sub: 'Breathe',
        iconUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuD3mTEN6l-6le85CyKg0phJBtFVeAvZCTObWJO5FL2S98QG9Dj7ycU5AezImbBoOMOQbtxzvZ0vJHcDiMAkF7jt8lDlhlVw3x_G7rCk4u2CVu8Wh4HcJUjUsIEGIB4lVhCk7y7YgTpKd8C9t7qkvZavfVzzbFKOIxRfawK1rY6b0lyASkngW8nz__JY0IjCuAANcTyE452JlgTXREvrhiLDk1fsmF3xJFycJl86UoQyGdOy_AyycoinKE7Tqiloz60zHS8wfQzGb10',
      },
      {
        title: 'Count to',
        sub: '10',
        badge: '10',
      },
      {
        title: 'Chant',
        sub: 'Hanuman Chalisa',
        iconUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAVlrhPrVvYmNq9bfFZ_R-bcSZVCre01v-fszN71asS3w7_97BxJA83O18EOuFIxr8ikmf1pHhJZtnJthUvjTkB4kJVA6FLDvvDUX8Ygo10Fk9j_azuviBsIHaj0sUIzi8fpBKkzj9KBZ0kZBN3UbJO3eAMvCwyznR6XcYORfRzI0ldgDqcWYsutOzmm-4vwoVyd9FWQppawfQV5CQ_QoG0ZoSR6K3yAty4ukYnkg8Muc_jTOT6cLB7IWqRRsfiEU5-HloKl3uwBgw',
      },
      {
        title: 'Serve',
        sub: 'Others',
        iconUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDq54O5BIv8yz0YEaBEab15LKq50H9wjs0Nd5vg2-A22fPVw_7XPRlRbOc1tkMg0lxLdvzC5oUk-BeNl56kjxXLSzQwHCgf8hWuQ9LSZJqHUT3urnX97LX8CDCoCu9q2dhRlVNaRm4JquTd-Z0iINU8K1XRxzrHahKA97gVnT16HaztFoTPZ7PTIvrh8rYT0mkjpV_pqVRkOt8d22me8r8a3461w3AOO54egGgxDC83n6SX0_NubqupAIUHnLGQMsjFORz_HFwmx8Y',
      },
    ],
    mantraSanskrit: 'ॐ ह्रीं हनुमते नमः',
    mantraTransliteration: 'Om Hreem Hanumate Namah',
    mantraMeaning:
      'I bow to Hanuman, the remover of inner weakness and anger.',
    bellImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArpKwiY-XtE1YqMyw0ti2l85nvrrW71_VV4SWJlR-PZrBhZoyPZW62BdS-Q_PrDz-e6uOCANrMZDbrQWjGhvKiT0kU6VzZZz_b9TWvXIu90h86iNVkb2G7RB0vPKvBXbsSmKCvY7O8P9uJ4Caq5GfUlZoTM0wclYFs5FwJ1h1EEdwAFefmFdhiNZCZChvNVmoD7GJe7lhpmKTynMYNetVOHdXHZUrMxVw8HLNfq_y7PKnZiNlt-QWyKl273nszTgmWAbLsuO60Fo0',
  },
  anxiety: {
    id: 'anxiety',
    title: 'Anxiety',
    tagline: 'Anchor Your Mind in Truth',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAOYmCSHWzCQNKnSaLt_34nUb-o3tA1kKqA0s0CYsAkNUwGwCfJYnX6u7VkwSua19URtoqpWU3kBR5PXQ4uUxXXbPuFoEbml0K20pbIngCkvHCJXtJ_f8cegC7aWFI_kgCtBG824Uqga-HnwB7jsv02m4SchVAdjlb7GjvWA2QNC8VU9bXZNy7jKJUOJTDKZmIRgv6r5_8sQ37zd1TuPeYJ8UJcy4W9Opd-9xW1UkY3kQ8X57Tj0PJ2WqLox_7bkcul7eRwBSNIiic',
    sanskrit:
      'नैनं छिन्दन्ति शस्त्राणि नैनं दहति पावकः ।\nन चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥',
    reference: '— Bhagavad Gita 2.23',
    transliteration:
      "nainam chindanti sastrani nainam dahati pavakah |\nna cainam kledayanty apo na sosayati marutah ||",
    translation:
      'The soul can never be cut to pieces by any weapon, nor burned by fire, nor moistened by water, nor withered by the wind.',
    silhouetteImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnKIgFlVqBhB11y4opyXxU57koxao_X7oK8lfg3cggmZIfW1Fr0dOrjGnERkoavofd2KbWRoR3-JLfpcNev80PbKLblvYINR8XZWTbR2iSHvg0woAYxPWnv70PZRQtvGJhJSDN2pim1hJs0KGWOXrT9tq3nAev5oFpkwEetcneIhOT_OC3XkPf4HLSNZeuPlKQQwZjpTalUL6PokfkJaN-wti-dNfFapD2S69-EK3P2RVMycR0AwhtR7lVl5jeFdFBWlcVCVuFhE',
    whatItMeans:
      'Anxiety stems from attachment to unwritten futures. Remembering your immortal soul restores unwavering inner stability.',
    meansImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYyfv2b8aMAMQfAuxvXk_tcrdbZTrWiiI05D1kYuVUSdtdFbqDYX6T-zMqFqAacGPZeQuU6mwpfJBMya5bca8z1BIJlOl0w1SDzqrHmFOtULh1Oawg7WcqtB94ElZNcHl2lYXNXyRae-jDWt0KnbaZWKCxMTK2PjfOROarawYvF9HBYfocMMmAUKKIe-UddjyEhj5HeuH_IV2vNMOV2uHhai08XEHXPeNlpCAUGMBEs0y5KgQlG6fecnOF0Ll-UgDo8RYRKqszyb8',
    exampleText:
      "Like an ocean that remains unagitated despite hundreds of rivers merging into it, stay calm amidst life's turbulence.",
    exampleImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIlgWcBWRjZaOKiSXwBcxlWLr-0eVfNRSXRF5DV-0PPQeCDpuXVRFZfqp_-AUEtwZEZDL4oykD38UIumWPb6C8yQBOEbQ3L30M_fV5AKZc9i3fD4UYx1-FH5-netJF9tTua3mNIuoBRu8bO98U_2BhPEI2w0qMI4zCI6t6pxK0L6wIHCSlpZLgrSbWeaYPw-qMJzZYkvyx0oN8p8ggTa5j-S8KInXbAundCW2bxSzvIVpnlj1MURaj0kpHx24v5dB3qi0JQVwcmJ8',
    actions: [
      { title: 'Grounding', sub: 'Breath' },
      { title: 'Chant', sub: 'Om' },
      { title: 'Meditate', sub: '10 Mins' },
      { title: 'Nature', sub: 'Walk' },
    ],
    mantraSanskrit: 'ॐ नमः शिवाय',
    mantraTransliteration: 'Om Namah Shivaya',
    mantraMeaning:
      'I surrender to the Divine Source of eternal peace and tranquility.',
    bellImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArpKwiY-XtE1YqMyw0ti2l85nvrrW71_VV4SWJlR-PZrBhZoyPZW62BdS-Q_PrDz-e6uOCANrMZDbrQWjGhvKiT0kU6VzZZz_b9TWvXIu90h86iNVkb2G7RB0vPKvBXbsSmKCvY7O8P9uJ4Caq5GfUlZoTM0wclYFs5FwJ1h1EEdwAFefmFdhiNZCZChvNVmoD7GJe7lhpmKTynMYNetVOHdXHZUrMxVw8HLNfq_y7PKnZiNlt-QWyKl273nszTgmWAbLsuO60Fo0',
  },
  stress: {
    id: 'stress',
    title: 'Stress',
    tagline: 'Surrender Outcome, Preserve Peace',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB44iUdZOfMN0jPoet21u6zeAtsPThwmYP0urGc62_0necbVW4FTDY6MptbcoLocgC-vubSaMA-CM0VcpVAsgn4L1AHqy4lBpoNm-prWeDJQaHxeHDFd8ujZyVuEIONPT0s5ln4lrZDVYzyIiOaMYwwuybexFXlzVEpuTPU01CUNUNz_Z2UOo1m9f8NWpKU4G72zilBaskjbIudiLvFXe6pke6_60e0crjfR6eDqx14-ifKHzGp7JKn3k7ZJzX2CnHabd-xo62upuE',
    sanskrit:
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    reference: '— Bhagavad Gita 2.47',
    transliteration:
      "karmany evadhikaras te ma phalesu kadacana |\nma karma-phala-hetur bhur ma te sango 'stvakarmani ||",
    translation:
      'You have a right to perform your duty, but never to its fruits. Do not let the fruits be your motive.',
    silhouetteImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnKIgFlVqBhB11y4opyXxU57koxao_X7oK8lfg3cggmZIfW1Fr0dOrjGnERkoavofd2KbWRoR3-JLfpcNev80PbKLblvYINR8XZWTbR2iSHvg0woAYxPWnv70PZRQtvGJhJSDN2pim1hJs0KGWOXrT9tq3nAev5oFpkwEetcneIhOT_OC3XkPf4HLSNZeuPlKQQwZjpTalUL6PokfkJaN-wti-dNfFapD2S69-EK3P2RVMycR0AwhtR7lVl5jeFdFBWlcVCVuFhE',
    whatItMeans:
      'Stress is the weight of expecting specific outcomes. When you offer your work as an act of worship, peace returns.',
    meansImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYyfv2b8aMAMQfAuxvXk_tcrdbZTrWiiI05D1kYuVUSdtdFbqDYX6T-zMqFqAacGPZeQuU6mwpfJBMya5bca8z1BIJlOl0w1SDzqrHmFOtULh1Oawg7WcqtB94ElZNcHl2lYXNXyRae-jDWt0KnbaZWKCxMTK2PjfOROarawYvF9HBYfocMMmAUKKIe-UddjyEhj5HeuH_IV2vNMOV2uHhai08XEHXPeNlpCAUGMBEs0y5KgQlG6fecnOF0Ll-UgDo8RYRKqszyb8',
    exampleText:
      'A tree yields shade and fruits freely without worrying about who sits under it. Perform your duty with equal freedom.',
    exampleImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIlgWcBWRjZaOKiSXwBcxlWLr-0eVfNRSXRF5DV-0PPQeCDpuXVRFZfqp_-AUEtwZEZDL4oykD38UIumWPb6C8yQBOEbQ3L30M_fV5AKZc9i3fD4UYx1-FH5-netJF9tTua3mNIuoBRu8bO98U_2BhPEI2w0qMI4zCI6t6pxK0L6wIHCSlpZLgrSbWeaYPw-qMJzZYkvyx0oN8p8ggTa5j-S8KInXbAundCW2bxSzvIVpnlj1MURaj0kpHx24v5dB3qi0JQVwcmJ8',
    actions: [
      { title: 'Release', sub: 'Control' },
      { title: 'Deep', sub: 'Breath' },
      { title: 'Recite', sub: 'Shloka' },
      { title: 'Rest', sub: 'Mind' },
    ],
    mantraSanskrit: 'ॐ शं शनैश्चराय नमः',
    mantraTransliteration: 'Om Sham Shanaye Namah',
    mantraMeaning:
      'May patience and quiet perseverance replace mental exhaustion.',
    bellImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArpKwiY-XtE1YqMyw0ti2l85nvrrW71_VV4SWJlR-PZrBhZoyPZW62BdS-Q_PrDz-e6uOCANrMZDbrQWjGhvKiT0kU6VzZZz_b9TWvXIu90h86iNVkb2G7RB0vPKvBXbsSmKCvY7O8P9uJ4Caq5GfUlZoTM0wclYFs5FwJ1h1EEdwAFefmFdhiNZCZChvNVmoD7GJe7lhpmKTynMYNetVOHdXHZUrMxVw8HLNfq_y7PKnZiNlt-QWyKl273nszTgmWAbLsuO60Fo0',
  },
  fear: {
    id: 'fear',
    title: 'Fear',
    tagline: 'Awaken Abhaya — Fearlessness',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCFwnEFRRSawmrb2cnryN9I4q5VcjDBA8I0MCkU8rNW8M_g355Dy44rrmRaXmi6jYq5-_bFP8m_V0tqEdQz7-BmiI6OwDa2JZc5FN4swf4y0Yz2Udtzq6Q0R0USurwIVLhcZYHT_Jjw9G7y0TqERUO_O5_m6aPvCKQ58CgWF9McCPKy5gs8cR0Z86l8C6-sYXVoNLTlsvQTnLfPS-WkMGgLr8UxPFk46lC13dPhgSP3mLoCrnr9C_1TlM-Te4LofHzZDbgjTotwJTk',
    sanskrit: 'अभयं सत्त्वसंशुद्धिर्ज्ञानयोगव्यवस्थितिः ।',
    reference: '— Bhagavad Gita 16.1',
    transliteration: 'abhayam sattva-samsuddhir jnana-yoga-vyavasthitih ||',
    translation:
      'Fearlessness, purity of mind, and steadfastness in spiritual knowledge are the highest divine virtues.',
    silhouetteImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnKIgFlVqBhB11y4opyXxU57koxao_X7oK8lfg3cggmZIfW1Fr0dOrjGnERkoavofd2KbWRoR3-JLfpcNev80PbKLblvYINR8XZWTbR2iSHvg0woAYxPWnv70PZRQtvGJhJSDN2pim1hJs0KGWOXrT9tq3nAev5oFpkwEetcneIhOT_OC3XkPf4HLSNZeuPlKQQwZjpTalUL6PokfkJaN-wti-dNfFapD2S69-EK3P2RVMycR0AwhtR7lVl5jeFdFBWlcVCVuFhE',
    whatItMeans:
      'Fear is an illusion created by identifying with the physical body. Divine protection always surrounds the pure heart.',
    meansImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYyfv2b8aMAMQfAuxvXk_tcrdbZTrWiiI05D1kYuVUSdtdFbqDYX6T-zMqFqAacGPZeQuU6mwpfJBMya5bca8z1BIJlOl0w1SDzqrHmFOtULh1Oawg7WcqtB94ElZNcHl2lYXNXyRae-jDWt0KnbaZWKCxMTK2PjfOROarawYvF9HBYfocMMmAUKKIe-UddjyEhj5HeuH_IV2vNMOV2uHhai08XEHXPeNlpCAUGMBEs0y5KgQlG6fecnOF0Ll-UgDo8RYRKqszyb8',
    exampleText:
      'A lion does not tremble at shadows in the forest. Know your divine origin and step forward with courage.',
    exampleImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIlgWcBWRjZaOKiSXwBcxlWLr-0eVfNRSXRF5DV-0PPQeCDpuXVRFZfqp_-AUEtwZEZDL4oykD38UIumWPb6C8yQBOEbQ3L30M_fV5AKZc9i3fD4UYx1-FH5-netJF9tTua3mNIuoBRu8bO98U_2BhPEI2w0qMI4zCI6t6pxK0L6wIHCSlpZLgrSbWeaYPw-qMJzZYkvyx0oN8p8ggTa5j-S8KInXbAundCW2bxSzvIVpnlj1MURaj0kpHx24v5dB3qi0JQVwcmJ8',
    actions: [
      { title: 'Gayatri', sub: 'Mantra' },
      { title: 'Light a', sub: 'Diya' },
      { title: 'Stand', sub: 'Tall' },
      { title: 'Invoke', sub: 'Courage' },
    ],
    mantraSanskrit: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं',
    mantraTransliteration: 'Om Bhur Bhuva Swaha Tat Savitur Varenyam',
    mantraMeaning:
      'May the divine light illuminate our intellect and dispel all darkness of fear.',
    bellImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArpKwiY-XtE1YqMyw0ti2l85nvrrW71_VV4SWJlR-PZrBhZoyPZW62BdS-Q_PrDz-e6uOCANrMZDbrQWjGhvKiT0kU6VzZZz_b9TWvXIu90h86iNVkb2G7RB0vPKvBXbsSmKCvY7O8P9uJ4Caq5GfUlZoTM0wclYFs5FwJ1h1EEdwAFefmFdhiNZCZChvNVmoD7GJe7lhpmKTynMYNetVOHdXHZUrMxVw8HLNfq_y7PKnZiNlt-QWyKl273nszTgmWAbLsuO60Fo0',
  },
  loneliness: {
    id: 'loneliness',
    title: 'Loneliness',
    tagline: 'Recognize Divine Companionship',
    heroImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBNYlLQedRJxB2VeVn6qzh_zEQnJc0JdRugwzqanvLOFyawRv1MNUSa_A7paO-yXjBrPb8sEglieOdboEHnOBnCfe1L6bwdU_3TuCkSVD3bI9NvSD-7es64dSzmUFhQWA8nf4whkB9W2kdXtfUSshCbIlaKYvur1gPGdqDMb92Tfkr5NWUomGucWAbAWJ57dJSAAyrfLoGgdo_R83vbBs9h8p8TiWMrT9ZI-pNW22HdvxSL72ZDuydcgrpuhOY2yiNUkzms6da7zS4',
    sanskrit: 'ईश्वरः सर्वभूतानां हृद्देशेऽर्जुन तिष्ठति ।',
    reference: '— Bhagavad Gita 18.61',
    transliteration: "isvarah sarva-bhutanam hrd-dese 'rjuna tisthati ||",
    translation:
      'The Supreme Lord dwells in the hearts of all living beings, O Arjuna.',
    silhouetteImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBpnKIgFlVqBhB11y4opyXxU57koxao_X7oK8lfg3cggmZIfW1Fr0dOrjGnERkoavofd2KbWRoR3-JLfpcNev80PbKLblvYINR8XZWTbR2iSHvg0woAYxPWnv70PZRQtvGJhJSDN2pim1hJs0KGWOXrT9tq3nAev5oFpkwEetcneIhOT_OC3XkPf4HLSNZeuPlKQQwZjpTalUL6PokfkJaN-wti-dNfFapD2S69-EK3P2RVMycR0AwhtR7lVl5jeFdFBWlcVCVuFhE',
    whatItMeans:
      'Loneliness fades when you realize the Supreme Friend rests inside your heart at every moment.',
    meansImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDYyfv2b8aMAMQfAuxvXk_tcrdbZTrWiiI05D1kYuVUSdtdFbqDYX6T-zMqFqAacGPZeQuU6mwpfJBMya5bca8z1BIJlOl0w1SDzqrHmFOtULh1Oawg7WcqtB94ElZNcHl2lYXNXyRae-jDWt0KnbaZWKCxMTK2PjfOROarawYvF9HBYfocMMmAUKKIe-UddjyEhj5HeuH_IV2vNMOV2uHhai08XEHXPeNlpCAUGMBEs0y5KgQlG6fecnOF0Ll-UgDo8RYRKqszyb8',
    exampleText:
      'A drop of water isolated feels small, but reunited with the eternal ocean, it becomes infinite.',
    exampleImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIlgWcBWRjZaOKiSXwBcxlWLr-0eVfNRSXRF5DV-0PPQeCDpuXVRFZfqp_-AUEtwZEZDL4oykD38UIumWPb6C8yQBOEbQ3L30M_fV5AKZc9i3fD4UYx1-FH5-netJF9tTua3mNIuoBRu8bO98U_2BhPEI2w0qMI4zCI6t6pxK0L6wIHCSlpZLgrSbWeaYPw-qMJzZYkvyx0oN8p8ggTa5j-S8KInXbAundCW2bxSzvIVpnlj1MURaj0kpHx24v5dB3qi0JQVwcmJ8',
    actions: [
      { title: 'Heart', sub: 'Prayer' },
      { title: 'Sacred', sub: 'Music' },
      { title: 'Journaling', sub: 'Blessings' },
      { title: 'Community', sub: 'Satsang' },
    ],
    mantraSanskrit: 'ॐ नमो भगवते वासुदेवाय',
    mantraTransliteration: 'Om Namo Bhagavate Vasudevaya',
    mantraMeaning:
      'I bow to the all-pervading Divine Lord who resides within all.',
    bellImage:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArpKwiY-XtE1YqMyw0ti2l85nvrrW71_VV4SWJlR-PZrBhZoyPZW62BdS-Q_PrDz-e6uOCANrMZDbrQWjGhvKiT0kU6VzZZz_b9TWvXIu90h86iNVkb2G7RB0vPKvBXbsSmKCvY7O8P9uJ4Caq5GfUlZoTM0wclYFs5FwJ1h1EEdwAFefmFdhiNZCZChvNVmoD7GJe7lhpmKTynMYNetVOHdXHZUrMxVw8HLNfq_y7PKnZiNlt-QWyKl273nszTgmWAbLsuO60Fo0',
  },
};
