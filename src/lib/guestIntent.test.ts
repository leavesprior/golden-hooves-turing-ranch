import assert from 'node:assert/strict'
import { classifyGuestIntent } from './guestIntent'

assert.equal(classifyGuestIntent({ need: 'charge' }), 'charge_overnight')
assert.equal(classifyGuestIntent({ need: 'explore' }), 'explore')
assert.equal(classifyGuestIntent({ search: '?utm_source=plugshare' }), 'charge_overnight')
assert.equal(classifyGuestIntent({ utmSource: 'tesla' }), 'charge_overnight')
assert.equal(classifyGuestIntent({ referrer: 'https://www.tesla.com/nav' }), 'unknown')
assert.equal(classifyGuestIntent({ search: '?q=volcano+theatre' }), 'explore')
assert.equal(classifyGuestIntent({ search: '' }), 'unknown')
assert.equal(classifyGuestIntent({ search: '?utm_source=tesla&need=explore' }), 'explore')

console.log('guestIntent tests passed')
