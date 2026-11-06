import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerAccount, authErrorMessage, type RegistrationDependencies, type RegistrationUser } from '../src/lib/registration';
const user: RegistrationUser = { uid:'uid', email:'new@example.test', emailVerified:false };
const input = {email:' new@example.test ',password:'password123',name:' Name ',mobile:'1234567890'};
function fixture() {
  const calls:string[]=[];
  const deps:RegistrationDependencies<RegistrationUser>={
    create:async(email)=>{calls.push('create');assert.equal(email,'new@example.test');return user},
    signIn:async()=>{calls.push('signIn');return user},
    profileExists:async()=>{calls.push('exists');return false},
    saveProfile:async(name)=>{calls.push('save');assert.equal(name,'Name')},
    sendVerification:async()=>{calls.push('verify')},
  }; return {deps,calls};
}
test('registration saves the profile before email delivery',async()=>{
  const {deps,calls}=fixture();assert.match(await registerAccount(input,deps),/Account created/);assert.deepEqual(calls,['create','save','verify']);
});
test('email delivery failure reports account saved instead of failed registration',async()=>{
  const {deps}=fixture();deps.sendVerification=async()=>{throw Error('quota')};assert.match(await registerAccount(input,deps),/account and profile are saved/);
});
test('profile failure is surfaced and a retry recovers the existing Firebase identity',async()=>{
  const {deps,calls}=fixture();deps.saveProfile=async()=>{throw Error('profile denied')};await assert.rejects(registerAccount(input,deps),/profile denied/);assert.ok(!calls.includes('verify'));
  deps.create=async()=>{throw {code:'auth/email-already-in-use'}};deps.saveProfile=async()=>{calls.push('save')};await registerAccount(input,deps);assert.ok(calls.includes('signIn'));assert.ok(calls.includes('exists'));
});
test('duplicate email never overwrites an existing profile or skips password verification',async()=>{
  const {deps,calls}=fixture();deps.create=async()=>{throw {code:'auth/email-already-in-use'}};deps.profileExists=async()=>true;
  await assert.rejects(registerAccount(input,deps),/already exists/);assert.ok(!calls.includes('save'));
  deps.signIn=async()=>{throw Object.assign(Error('bad credentials'),{code:'auth/invalid-credential'})};await assert.rejects(registerAccount(input,deps),/bad credentials/);assert.ok(!calls.includes('save'));
});
test('Firebase configuration/network failures do not fall through to profile creation',async()=>{
  const {deps,calls}=fixture();deps.create=async()=>{throw {code:'auth/operation-not-allowed'}};
  await assert.rejects(registerAccount(input,deps));assert.deepEqual(calls,[]);
  assert.match(authErrorMessage({code:'auth/operation-not-allowed'},'failed'),/disabled/);
  assert.match(authErrorMessage({code:'auth/invalid-credential'},'failed'),/incorrect/);
});
