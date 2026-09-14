import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { NO_OXEN_EVENT } from '../src/app/oregon-trail/state/travelEngine'

// Real React wallet + trail providers + actual SaveLoadIntegration. Auth/save
// registration/network/mystery adapters are controlled; no account API claim.
const root = fileURLToPath(new URL('../', import.meta.url))
const output = `artifacts/live-saddle-teamster/${process.argv[2] ?? 'provider'}`
const walletKey = 'oregon_trail_karma_wallet', saveKey = 'golden_frog_local_save'
const core = { ...DEFAULT_STATE, phase:'event', currentEvent:NO_OXEN_EVENT, oxen:0, food:200, day:12,
  inventory:['fixture-keepsake'], completedQuests:['fixture-prior-quest'] }
const sourceFiles = ['src/app/oregon-trail/karmaWalletContext.tsx','src/app/oregon-trail/oregonTrailContext.tsx',
  'src/app/oregon-trail/phases/SaveLoadIntegration.tsx','src/app/oregon-trail/state/teamsterHire.ts',
  'src/app/oregon-trail/state/reducer.ts','src/lib/goldCountryFare.ts','tools/teamsterProvider.browser.ts']
async function hashes() { return Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path,createHash('sha256').update(await readFile(path)).digest('hex')]))) }

async function main() {
  const sourceHashes = await hashes()
  const bundle = await build({ stdin:{resolveDir:root,sourcefile:'teamster-provider-fixture.tsx',loader:'tsx',contents:`
    import React,{useLayoutEffect} from 'react';
    import {createRoot} from 'react-dom/client';
    import {KarmaWalletProvider,useKarmaWallet} from './src/app/oregon-trail/karmaWalletContext';
    import {OregonTrailProvider,useOregonTrail} from './src/app/oregon-trail/oregonTrailContext';
    import {SaveLoadIntegration} from './src/app/oregon-trail/phases/SaveLoadIntegration';
    window.__h={wallet:null,trail:null,loader:null,mode:'none',writes:[],sync:[],core:${JSON.stringify(core)},
      user:{id:'fixture-own-account'},mystery:{},saves:{setActiveGameType(){},setGameDataCollector(){},setMetadataCollector(){},enableAutoSave(){},setGameDataLoader(loader){window.__h.loader=loader}}};
    const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if([${JSON.stringify(walletKey)},${JSON.stringify(saveKey)}].includes(key)){
        const data=JSON.parse(value),h=window.__h;
        const failed=(key===${JSON.stringify(saveKey)}&&((h.mode==='plan'&&!!data.state?.teamsterHire)||(h.mode==='completion'&&data.state?.oxen===2)))
          || key===${JSON.stringify(walletKey)}&&h.mode==='wallet'&&data.travelFareReceipts?.length>0;
        h.writes.push({key,data,failed});if(failed)throw new DOMException('QA storage failure','QuotaExceededError');
      }return set.call(this,key,value);
    };
    function Probe(){const wallet=useKarmaWallet(),trail=useOregonTrail();
      useLayoutEffect(()=>{window.__h.wallet=wallet},[wallet]);
      useLayoutEffect(()=>{window.__h.trail=trail},[trail]);
      useLayoutEffect(()=>{trail.loadState(window.__h.core)},[]);
      return <SaveLoadIntegration/>;
    }
    createRoot(document.getElementById('root')).render(<React.StrictMode><KarmaWalletProvider><OregonTrailProvider><Probe/></OregonTrailProvider></KarmaWalletProvider></React.StrictMode>);
  `},bundle:true,platform:'browser',format:'iife',write:false,define:{'process.env.NODE_ENV':'"development"'},
    plugins:[{name:'controlled-unrelated-adapters',setup(builder){
      const stubs:Record<string,string>={
        '@/lib/karmaContext':`export const useKarma=()=>({applyKarma(){}})`,
        '@/lib/karmaBlockchain':`export class KarmaBlockchainClient {};export const oregonTrailKarma=new Proxy({pendingCount:0,online:false},{get:(target,key)=>key in target?target[key]:(...args)=>Promise.resolve(key==='checkConnection'?false:undefined)});`,
        '@/lib/karmaStorage':`export const KarmaStorage={load:()=>null,applyAction(){}}`,
        '@/lib/crossGameProgression':`export const CrossGameStorage={syncKarmaToPool(){},loadSharedKarma:()=>({totalEarned:0})}`,
        '@/lib/karmaServerSync':`export const getKarmaSessionId=()=>'fixture';export const fetchServerBalance=async()=>({ok:false});export const reconcile=local=>local;export const postKarmaEvent=async data=>{window.__h.sync.push(data);return {ok:false}}`,
        '@/lib/authContext':`export const useAuth=()=>({user:window.__h.user})`,
        '@/lib/saveLoadContext':`export const useSaveLoad=()=>window.__h.saves`,
        '../mysteryContext':`export const useMystery=()=>({state:window.__h.mystery,loadMysteryState(){}})`,
      };
      builder.onResolve({filter:/./},args=>stubs[args.path]?{path:args.path,namespace:'fixture'}:undefined);
      builder.onLoad({filter:/./,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'js'}));
    }}]})
  const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/app.js'?'text/javascript':'text/html');response.end(request.url==='/app.js'?bundle.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/app.js"></script>')})
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
  const address=server.address();assert.ok(address&&typeof address!=='string')
  const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']})
  const results:object[]=[]
  try {
    for(const scenario of ['same-event-race','plan','wallet-cancel','slot-matching','slot-missing','slot-invalid','farm-slot-matching','farm-slot-missing']){
      const context=await browser.newContext()
      await context.addInitScript(({walletKey})=>{localStorage.setItem(walletKey,JSON.stringify({balance:{neutral:100,good:12,bad:2},walletMode:'continue',alignment:{lawfulChaotic:0,goodEvil:0},fixtureDonor:'kept'}))},{walletKey})
      const page=await context.newPage(),errors:string[]=[]
      page.on('pageerror',error=>errors.push(error.message))
      await page.goto(`http://127.0.0.1:${address.port}`)
      await page.waitForFunction('window.__h.wallet?.isInitialized && window.__h.loader && window.__h.trail?.state.phase==="event"')
      let actual:Record<string,unknown>
      if(scenario==='same-event-race'){
        actual=await page.evaluate(`(async()=>{const h=window.__h,t=h.trail;const paid=t.hireTeamster(),duplicate=t.hireTeamster();t.handleEventChoice('abandon_wagon');return {paid:await paid,duplicate:await duplicate,state:t.getCurrentState()}})()`)
        assert.deepEqual(actual.paid,{ok:true});assert.deepEqual(actual.duplicate,{ok:false,reason:'busy'})
        assert.equal((actual.state as typeof core).oxen,2);assert.equal(!!(actual.state as typeof core).wagonAbandoned,false)
      }else if(scenario==='plan'||scenario==='wallet-cancel'){
        actual=await page.evaluate(`(async()=>{const h=window.__h,t=h.trail;h.mode=${JSON.stringify(scenario==='plan'?'plan':'wallet')};const failed=await t.hireTeamster();const pending=t.getCurrentState();h.mode='none';t.handleEventChoice('walk_to_town');return {failed,pending,walked:t.getCurrentState()}})()`)
        assert.deepEqual(actual.failed,{ok:false,reason:'storage'})
        const pending=actual.pending as typeof core & {teamsterHire?:unknown}
        assert.equal(pending.oxen,0);assert.equal(pending.food,200);assert.equal(pending.day,12)
        assert.equal(!!pending.teamsterHire,scenario==='wallet-cancel')
        assert.equal((actual.walked as typeof core).day,13)
      }else{
        actual=await page.evaluate(`(async()=>{const h=window.__h;h.mode='completion';const failed=await h.trail.hireTeamster();${scenario.startsWith('farm-')?'h.trail.openRanchManagement();':''}const pending=JSON.parse(JSON.stringify(h.trail.getCurrentState()));const saved=JSON.parse(JSON.stringify(pending));
          ${scenario.endsWith('slot-missing')?"saved.teamsterHire.id='teamster_other-order';":scenario==='slot-invalid'?"saved.teamsterHire.cost=21;":''}
          h.loader({oregonTrail:saved,karmaBalance:{neutral:100,good:70,bad:9},karmaAlignment:{lawfulChaotic:22,goodEvil:11}});
          return {failed,pending,loaded:h.trail.getCurrentState()};})()`)
        assert.deepEqual(actual.failed,{ok:false,reason:'storage'})
        assert.equal((actual.loaded as typeof core).oxen,0)
        await page.waitForFunction(`window.__h.wallet.balance.neutral===${scenario.endsWith('slot-matching')?80:100}`)
        if(scenario.endsWith('slot-matching')){
          const retried=await page.evaluate<{ result:{ok:boolean};state:typeof core }>(`(async()=>{const h=window.__h;h.mode='none';${scenario.startsWith('farm-')?'h.trail.closeRanchManagement();':''}const result=await h.trail.hireTeamster();return {result,state:h.trail.getCurrentState()}})()`)
          assert.deepEqual(retried.result,{ok:true});assert.equal(retried.state.oxen,2);assert.equal(retried.state.day,14)
          actual.retried=retried
        }
      }
      const final=await page.evaluate<{wallet:{balance:{neutral:number;good:number};travelFareReceipts?:unknown[];fixtureDonor:string};state:typeof core;writes:unknown[];sync:unknown[]}>(`({wallet:JSON.parse(localStorage.getItem(${JSON.stringify(walletKey)})),state:window.__h.trail.getCurrentState(),writes:window.__h.writes,sync:window.__h.sync})`)
      assert.equal(final.wallet.balance.neutral,['plan','wallet-cancel','slot-missing','slot-invalid','farm-slot-missing'].includes(scenario)?100:80)
      assert.equal(final.wallet.travelFareReceipts?.length??0,['plan','wallet-cancel'].includes(scenario)?0:1)
      assert.equal(final.wallet.fixtureDonor,'kept')
      assert.equal(final.wallet.balance.good,['slot-missing','slot-invalid','farm-slot-missing'].includes(scenario)?70:12)
      assert.deepEqual(errors,[])
      results.push({scenario,ok:true,actual,final,errors});console.log('PASS actual teamster providers and slot loader',scenario)
      await context.close()
    }
    assert.deepEqual(await hashes(),sourceHashes)
  } finally {
    await mkdir(output,{recursive:true})
    await writeFile(`${output}/results.json`,JSON.stringify({sourceHashes,endHashes:await hashes(),browser:browser.version(),results},null,2)+'\n')
    await browser.close();await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))
  }
}
main().catch(error=>{console.error(error);process.exitCode=1})
