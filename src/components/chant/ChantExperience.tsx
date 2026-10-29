import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { chantApi, chantDetails, chantLibrary, getPublishedChant } from '../../lib/chant';
import { ChantAdmin } from './ChantAdmin';
import { ChantExperienceContent, type ChantExperienceProps, type ChantExperienceServices } from './ChantExperienceContent';
import './chant.css';

// Stable adapters keep the view testable without replacing its production data flow.
const services:ChantExperienceServices = {
 api:chantApi,
 library:chantLibrary,
 details:chantDetails,
 getPublishedChant,
 currentUid:()=>auth.currentUser?.uid,
 subscribeAuth:listener=>onAuthStateChanged(auth,user=>listener(user?.uid??null)),
 renderAdmin:role=><ChantAdmin role={role}/>,
};
export function ChantExperience(props:ChantExperienceProps) {
 return <ChantExperienceContent {...props} services={services}/>;
}
