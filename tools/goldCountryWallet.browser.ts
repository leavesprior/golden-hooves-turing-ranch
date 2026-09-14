import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { DEFAULT_STATE } from '../src/app/oregon-trail/state/constants'
import { quoteGoldCountryTransport } from '../src/lib/goldCountryTransport'

// Real React wallet and real SaveLoadIntegration; unrelated contexts/network
// adapters are controlled here. This is not an authenticated account API test.
const root = fileURLToPath(new URL('../', import.meta.url))
const output = `artifacts/year-gated-transport/${process.argv[2] ?? 'wallet-provider'}`
const key = 'oregon_trail_karma_wallet'
const clock = { day: 91, goldCountryDay: 991, goldCountryMinute: 0 }
const quoted = quoteGoldCountryTransport({ fromId: 'volcano', toId: 'murphys', mode: 'stage', clock, luck: 5, roll: 0.99 })
if (!quoted.ok) throw new Error('Invalid fixture route')
const trip = { version: 1, id: 'qa_fare', status: 'planned', departureClock: clock, quote: quoted.quote, roadEncounterId: null }
const core = { ...DEFAULT_STATE, ...clock, phase: 'gold_country_travel', currentGoldCountryLocation: 'volcano', travelingToLocation: 'murphys', goldCountryTrip: trip }

async function main() {
  const code = await build({ stdin: { resolveDir: root, sourcefile: 'wallet-browser-fixture.tsx', loader: 'tsx', contents: `
    import React, { useLayoutEffect, useRef } from 'react';
    import { createRoot } from 'react-dom/client';
    import { KarmaWalletProvider, useKarmaWallet } from './src/app/oregon-trail/karmaWalletContext';
    import { OregonTrailProvider, useOregonTrail } from './src/app/oregon-trail/oregonTrailContext';
    import { SaveLoadIntegration } from './src/app/oregon-trail/phases/SaveLoadIntegration';
    window.__h = { sync: [], oldSync: [], loaded: [], initial: [], writes: [], fail: false, wallet: null, loader: null,
      user: { id: 'fixture-own-account' }, core: ${JSON.stringify(core)}, mystery: {},
      saves: { setActiveGameType() {}, setGameDataCollector() {}, setMetadataCollector() {}, enableAutoSave() {},
        setGameDataLoader(loader) { window.__h.loader = loader } } };
    const nativeSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === ${JSON.stringify(key)}) {
        window.__h.writes.push(JSON.parse(value));
        if (window.__h.fail) throw new DOMException('Fixture denied write', 'QuotaExceededError');
      }
      return nativeSet.call(this, key, value);
    };
    function Probe() {
      const wallet = useKarmaWallet();
      const trail = useOregonTrail();
      useLayoutEffect(() => { window.__h.trail=trail },[trail]);
      useLayoutEffect(() => { trail.loadState(window.__h.core) },[]);
      const attempted = useRef(false);
      useLayoutEffect(() => { window.__h.wallet = wallet }, [wallet]);
      useLayoutEffect(() => { if(attempted.current) return; attempted.current=true; void wallet.spendTravelFare('too_early', 10).then(result => window.__h.initial.push(result)) }, []);
      return <><SaveLoadIntegration /><output id="ready">{wallet.isInitialized ? 'ready' : 'loading'}</output></>;
    }
    createRoot(document.getElementById('root')).render(<React.StrictMode><KarmaWalletProvider><OregonTrailProvider><Probe /></OregonTrailProvider></KarmaWalletProvider></React.StrictMode>);
  ` }, bundle: true, platform: 'browser', format: 'iife', write: false,
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'wallet-browser-fixture-adapters', setup(builder) {
      const stubs: Record<string, string> = {
        '@/lib/karmaContext': `export const useKarma = () => ({ applyKarma(){} })`,
        '@/lib/karmaBlockchain': `export class KarmaBlockchainClient {}; export const oregonTrailKarma = new Proxy({ pendingCount: 0, online: false }, { get: (target,key) => key in target ? target[key] : (...args) => { window.__h.oldSync.push({key,args}); return Promise.resolve(key==='checkConnection' ? false : undefined) } });`,
        '@/lib/karmaStorage': `export const KarmaStorage = { load: () => null, applyAction() {} }`,
        '@/lib/crossGameProgression': `export const CrossGameStorage = { syncKarmaToPool() {}, loadSharedKarma: () => ({totalEarned:0}) }`,
        '@/lib/karmaServerSync': `export const getKarmaSessionId = () => 'fixture'; export const fetchServerBalance = async () => ({ok:false}); export const reconcile = local => local; export const postKarmaEvent = async data => { window.__h.sync.push(data); return {ok:false} }`,
        '@/lib/authContext': `export const useAuth = () => ({user:window.__h.user})`,
        '@/lib/saveLoadContext': `export const useSaveLoad = () => window.__h.saves`,
        '../oregonTrailContext': `export const useOregonTrail = () => ({state:window.__h.core,loadState:data=>window.__h.loaded.push(data)})`,
        '../mysteryContext': `export const useMystery = () => ({state:window.__h.mystery,loadMysteryState(){}})`,
      }
      builder.onResolve({ filter: /./ }, args => stubs[args.path] ? { path: args.path, namespace: 'wallet-fixture' } : undefined)
      builder.onLoad({ filter: /./, namespace: 'wallet-fixture' }, args => ({ contents: stubs[args.path], loader: 'js' }))
    } }],
  })
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html')
    response.end(request.url === '/app.js' ? code.outputFiles[0].text : '<!doctype html><div id="root"></div><script src="/app.js"></script>')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const results: object[] = []
  try {
    for (const scenario of ['queued-and-replay', 'storage-failure', 'slot-matching', 'slot-missing', 'trip-in-flight-race']) {
      const context = await browser.newContext()
      await context.addInitScript(({key}) => {
        localStorage.setItem(key, JSON.stringify({balance:{neutral:400,good:12,bad:2},walletMode:'continue',alignment:{lawfulChaotic:0,goodEvil:0},futureField:'retained'}))
        localStorage.setItem('bobr_gft_age_mode', 'adult')
      }, {key})
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR',error.message) })
      page.on('console', message => { if(message.type()==='error') console.error('BROWSER',message.text()) })
      await page.goto(`http://127.0.0.1:${address.port}/`)
      await page.waitForFunction('window.__h.wallet?.isInitialized && !!window.__h.loader')
      let actual: Record<string, unknown>
      if (scenario === 'queued-and-replay') {
        actual = await page.evaluate(`(async () => {
          const h=window.__h, w=h.wallet;
          const earnings=w.earnNeutral(20), purchase=w.spendNeutral(7);
          const paid=w.spendTravelFare('qa_fare',10), duplicate=w.spendTravelFare('qa_fare',10);
          await Promise.all([earnings,purchase]);
          return {paid:await paid, duplicate:await duplicate, conflict:await w.spendTravelFare('qa_fare',9),
            has:w.hasTravelFareReceipt('qa_fare',10), wrong:w.hasTravelFareReceipt('qa_fare',9)};
        })()`)
        assert.deepEqual(actual.paid, {ok:true,replayed:false})
        assert.deepEqual(actual.duplicate, {ok:true,replayed:true})
        assert.deepEqual(actual.conflict, {ok:false,reason:'conflict'})
        assert.equal(actual.has, true); assert.equal(actual.wrong, false)
        await page.waitForFunction('window.__h.wallet.balance.neutral === 403')
      } else if (scenario === 'storage-failure') {
        actual = await page.evaluate(`(async () => {
          const h=window.__h; h.fail=true;
          const failed=await h.wallet.spendTravelFare('qa_fare',10);
          const balance=h.wallet.balance.neutral, has=h.wallet.hasTravelFareReceipt('qa_fare',10);
          h.fail=false; const retried=await h.wallet.spendTravelFare('qa_fare',10);
          return {failed,balance,has,retried};
        })()`)
        assert.deepEqual(actual.failed, {ok:false,reason:'storage'})
        assert.equal(actual.balance,400); assert.equal(actual.has,false)
        assert.deepEqual(actual.retried,{ok:true,replayed:false})
        await page.waitForFunction('window.__h.wallet.balance.neutral === 390')
      } else if (scenario === 'trip-in-flight-race') {
        actual = await page.evaluate(`(async () => {
          const h=window.__h, t=h.trail;
          const paying=t.resumeGoldCountryTravel();
          const duplicate=t.resumeGoldCountryTravel();
          const cancelled=t.cancelGoldCountryTravel();
          const secondDeparture=t.startGoldCountryTravel('jackson','stage',5);
          const results={paying:await paying,duplicate:await duplicate,cancelled,secondDeparture:await secondDeparture};
          return {...results,trip:t.getCurrentState().goldCountryTrip};
        })()`)
        assert.deepEqual(actual.paying,{ok:true})
        assert.deepEqual(actual.duplicate,{ok:true})
        assert.deepEqual(actual.cancelled,{ok:false,reason:'conflict'})
        assert.deepEqual(actual.secondDeparture,{ok:false,reason:'busy'})
        assert.equal((actual.trip as {status:string}).status,'paid')
        await page.waitForFunction('window.__h.wallet.balance.neutral === 390')
      } else {
        actual = await page.evaluate(`(async () => {
          const h=window.__h; await h.wallet.spendTravelFare('qa_fare',10);
          const saved=JSON.parse(JSON.stringify(h.core));
          ${scenario === 'slot-missing' ? "saved.goldCountryTrip.id='unpaid_other_trip';" : ''}
          h.loader({oregonTrail:saved,karmaBalance:{neutral:400,good:70,bad:9},karmaAlignment:{lawfulChaotic:22,goodEvil:11}});
          return {loaded:h.loaded};
        })()`)
        assert.equal((actual.loaded as unknown[]).length,1)
        await page.waitForFunction(`window.__h.wallet.balance.neutral === ${scenario === 'slot-matching' ? 390 : 400}`)
      }
      const final = await page.evaluate<{
        stored: { futureField: string; travelFareReceipts: unknown[]; balance: {neutral:number} };
        balance: {neutral:number;good:number;bad:number}; alignment: {lawfulChaotic:number};
        initial: Array<{ok:boolean;reason?:string}>; sync: Array<{delta:number}>;
        oldSync: Array<{key:string;args:number[]}>;
      }>(`({stored:JSON.parse(localStorage.getItem(${JSON.stringify(key)})), balance:window.__h.wallet.balance, alignment:window.__h.wallet.alignment, initial:window.__h.initial, sync:window.__h.sync, oldSync:window.__h.oldSync})`)
      assert.equal(final.stored.futureField,'retained')
      assert.equal(final.stored.travelFareReceipts.length,1)
      assert.equal(final.stored.balance.neutral,scenario==='queued-and-replay'?403:scenario==='slot-missing'?400:390)
      assert.equal(final.balance.good,scenario==='slot-missing'?70:12)
      assert.equal(final.balance.bad,scenario==='slot-missing'?9:2)
      assert.equal(final.alignment.lawfulChaotic,scenario==='slot-missing'?22:0)
      assert.ok(final.initial.some((result: {ok:boolean;reason?:string}) => !result.ok && result.reason==='invalid'))
      assert.equal(final.sync.filter((event: {delta:number})=>event.delta===-10).length,1)
      assert.equal(final.oldSync.filter((event: {key:string;args:number[]})=>event.key==='spendNeutral'&&event.args[0]===10).length,1)
      assert.deepEqual(errors,[])
      results.push({scenario,ok:true,actual,final,pageErrors:errors})
      console.log('PASS real wallet + save loader',scenario)
      await context.close()
    }
  } finally {
    await mkdir(output,{recursive:true})
    await writeFile(`${output}/results.json`,JSON.stringify(results,null,2))
    await browser.close()
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))
  }
}
void main().catch(error=>{console.error(error);process.exitCode=1})
