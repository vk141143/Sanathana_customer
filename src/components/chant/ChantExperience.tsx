import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { chantApi, chantDetails, getPublishedChant } from '../../lib/chant';
import { practiceChantCatalogue } from '../../lib/practiceChant';
import { ChantAdmin } from './ChantAdmin';
import { ChantExperienceContent, type ChantExperienceProps, type ChantExperienceServices } from './ChantExperienceContent';
import './chant.css';

// Stable adapters keep the view testable without replacing its production data flow.
const services:ChantExperienceServices = {
 api:chantApi,
 details:chantDetails,
 getPublishedChant,
 currentUid:()=>auth.currentUser?.uid,
 subscribeAuth:listener=>onAuthStateChanged(auth,user=>listener(user?.uid??null)),
 renderAdmin:role=><ChantAdmin role={role}/>,
 practices:practiceChantCatalogue,
};
export function ChantExperience(props:ChantExperienceProps) {
 return <ChantExperienceContent {...props} services={services}/>;
}
