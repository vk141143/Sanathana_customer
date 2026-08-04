import { Chapter, Verse } from '../types';

export const GITA_VERSES: Verse[] = [
  {
    id: 'gita-2-11',
    chapterNumber: 2,
    verseNumber: 11,
    sanskrit: `श्रीभगवानुवाच |\nअशोच्यानन्वशोचस्त्वं प्रज्ञावादांश्च भाषसे |\nगतासूनगतासूंश्च नानुशोचन्ति पण्डिता: || 11||`,
    transliteration: `śrī-bhagavān uvāca\naśocyān anvaśocas tvaṁ prajñā-vādānśh cha bhāṣhase\ngatāsūn agatāsūnśh cha nānuśochanti paṇḍitāḥ`,
    translation: `"The Supreme Lord said: While you are speaking learned words, you are mourning for what is not worthy of grief. Those who are wise lament neither for the living nor for the dead."`,
    explanation: `The Blessed Lord begins His teaching by highlighting the distinction between the eternal soul (Atman) and the perishable physical body. True wisdom recognizes that life and death are merely transitions of the immortal self, making grief for temporal changes unfounded.`
  },
  {
    id: 'gita-2-12',
    chapterNumber: 2,
    verseNumber: 12,
    sanskrit: `न त्वेवाहं जातु नासं न त्वं नेमे जनाधिपा: |\nन चैव न भविष्याम: सर्वे वयमत: परम् || 12||`,
    transliteration: `na tv evāhaṁ jātu nāsaṁ na tvaṁ neme janādhipāḥ\nna chaiva na bhaviṣhyāmaḥ sarve vayam ataḥ param`,
    translation: `"Never was there a time when I did not exist, nor you, nor all these kings; nor in the future shall any of us cease to be."`,
    explanation: `Here Lord Krishna reveals the eternal truth of individual consciousness. We have existed eternally in the past, exist in the present, and will continue to exist forever beyond physical death.`
  },
  {
    id: 'gita-2-13',
    chapterNumber: 2,
    verseNumber: 13,
    sanskrit: `देहिनोऽस्मिन्यथा देहे कौमारं यौवनं जरा |\nतथा देहान्तरप्राप्तिर्धीरस्तत्र न मुह्यति || 13||`,
    transliteration: `dehino ’smin yathā dehe kaumāraṁ yauvanaṁ jarā\ntathā dehāntara-prāptir dhīras tatra na muhyati`,
    translation: `"As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change."`,
    explanation: `Just as we witness our own physical body transforming smoothly through childhood, youth, and elderly age without losing our inner identity, the passing of the soul into a new body at death is simply another natural transformation.`
  },
  {
    id: 'gita-2-47',
    chapterNumber: 2,
    verseNumber: 47,
    sanskrit: `कर्मण्येवाधिकारस्ते मा फलेषु कदाचन |\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि || 47||`,
    transliteration: `karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo ’stvakarmaṇi`,
    translation: `"You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, nor be attached to inaction."`,
    explanation: `The core principle of Karma Yoga: Focus whole-heartedly on doing your righteous duty with dedication and selfless action, surrendering the outcome to the Divine.`
  },
  {
    id: 'gita-6-5',
    chapterNumber: 6,
    verseNumber: 5,
    sanskrit: `उद्धरेदात्मनात्मानं नात्मानमवसादयेत् |\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मन: || 5||`,
    transliteration: `uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ`,
    translation: `"Elevate yourself through the power of your mind, and do not degrade yourself. For the mind can be the best friend and also the worst enemy of the self."`,
    explanation: `A disciplined, peaceful mind is a wise ally guiding you toward inner freedom; an uncontrolled mind creates self-doubt and suffering.`
  }
];

export const GITA_CHAPTERS: Chapter[] = [
  {
    number: 2,
    title: 'Chapter 2: Sankhya Yoga',
    subTitle: 'The Yoga of Analytical Knowledge',
    totalVerses: 72,
    verses: GITA_VERSES.filter(v => v.chapterNumber === 2),
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDlnPX8xiSdKbpf55g0742QCfaiz03C5ZV9IAm6LZMxYDmyEJ3ybtqUx43Uka31Wfp3d27MtIQgyAxi6GIVUo-GgqWbQLvO-PUbxRVlII27wxZSun4BS55vqp24AVXdG3Et3gGESx-m07AEzFgi9MuuulM5cWmMqly7XPqKXC1i00_Qu3S2wxcbCCiBBmR0K-lg-ZmK0hFKc2yy0tgqoxjUT1dvFKzdhaPPrp7cN_PccPktv56pelOG-EOIR4xPc42FIiFi3rejOM'
  },
  {
    number: 6,
    title: 'Chapter 6: Dhyana Yoga',
    subTitle: 'The Yoga of Meditation',
    totalVerses: 47,
    verses: GITA_VERSES.filter(v => v.chapterNumber === 6),
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkgtMTRpmVEm_A9G2CVOxgHiZO842QnTXrGJ0FEjBiukTUr5dzEUaxoAJAXLIY2DhhP3sC6w0cj2HogA1DZ_Qfa-kH11qjxN3y_Syvt-hDJVzk1GSAnkIc3G6ZZeW95O7CC36XjGY8PerrOrWZmW1WahKLA3JG5gazqhFyuALxLONu2Rxg1dsP3yXrd20fE_Po5hfI-ltkJhFPoxdBWjqXIy5WFnpCkDLyLK91ZME25uTo7nkjfJCBwV400UCbnb069qiHpb4tE9k'
  }
];
