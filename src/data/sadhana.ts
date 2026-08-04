import { SadhanaTask } from '../types';

export const DEFAULT_SADHANA_TASKS: SadhanaTask[] = [
  {
    id: 'meditation-task',
    title: 'Meditation',
    subtitle: '20 min target',
    target: '20 min',
    completed: true,
    type: 'meditation',
    progressValue: 20,
    targetValue: 20,
    unit: 'min'
  },
  {
    id: 'reading-task',
    title: 'Scripture Reading',
    subtitle: 'Gita Chapter 2',
    target: '1 Chapter',
    completed: true,
    type: 'reading',
    progressValue: 1,
    targetValue: 1,
    unit: 'Chapter'
  },
  {
    id: 'gratitude-task',
    title: 'Gratitude Journal',
    subtitle: '3 Daily Blessings',
    target: 'Completed',
    completed: true,
    type: 'gratitude',
    progressValue: 3,
    targetValue: 3,
    unit: 'Blessings'
  },
  {
    id: 'chanting-task',
    title: 'Mantra Chanting',
    subtitle: '108 Repetitions',
    target: 'Start',
    completed: false,
    type: 'chanting',
    progressValue: 0,
    targetValue: 108,
    unit: 'Chants'
  }
];
