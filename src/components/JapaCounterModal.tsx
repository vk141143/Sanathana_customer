import React from 'react';
import { ChantExperience } from './chant/ChantExperience';
interface Props { preferredLanguage?: string; isOpen: boolean; onClose: () => void; onCompleteChanting: (count: number) => void; }
export const JapaCounterModal: React.FC<Props> = ({isOpen,onClose,onCompleteChanting,preferredLanguage}) =>
  isOpen ? <ChantExperience preferredLanguage={preferredLanguage} onClose={onClose} onComplete={onCompleteChanting}/> : null;
