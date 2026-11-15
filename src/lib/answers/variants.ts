// amerykańska pisownia przechodzi jako poprawna, ale tylko dla par, gdzie nie ma pułapki znaczeniowej.
// Celowo bez practice/practise, licence/license, program/programme i meter/metre: w brytyjskim pisownia
// odróżnia tam rzeczownik od czasownika albo dwa różne słowa, więc zamiana przepuściłaby błąd.

// -or → -our; końcówki dobrane ręcznie, bo humorous, honorary, laborious mają w brytyjskim bez u
const OUR = ['color', 'favor', 'honor', 'humor', 'labor', 'neighbor', 'behavior', 'flavor']
const OUR_ENDS = [
  '',
  's',
  'ed',
  'ing',
  'ful',
  'able',
  'ably',
  'ite',
  'ites',
  'hood',
  'hoods',
  'less',
]

// -ize → -ise: oba są poprawne w brytyjskim, więc to tylko wyrównanie
const IZE = [
  'organiz',
  'realiz',
  'recogniz',
  'apologiz',
  'criticiz',
  'emphasiz',
  'specializ',
  'prioritiz',
  'summariz',
  'memoriz',
  'minimiz',
  'maximiz',
  'moderniz',
  'socializ',
  'familiariz',
  'globaliz',
  'industrializ',
  'normaliz',
  'finaliz',
  'legaliz',
  'personaliz',
  'visualiz',
  'analyz',
  'paralyz',
]
const IZE_ENDS = ['e', 'es', 'ed', 'ing', 'er', 'ers', 'ation', 'ations']

const WORDS: [string, string][] = [
  ['center', 'centre'],
  ['centers', 'centres'],
  ['theater', 'theatre'],
  ['theaters', 'theatres'],
  ['liter', 'litre'],
  ['liters', 'litres'],
  ['fiber', 'fibre'],
  ['defense', 'defence'],
  ['offense', 'offence'],
  ['gray', 'grey'],
  ['catalog', 'catalogue'],
  ['jewelry', 'jewellery'],
  ['pajamas', 'pyjamas'],
  ['aluminum', 'aluminium'],
  ['skeptical', 'sceptical'],
  ['enroll', 'enrol'],
  ['fulfill', 'fulfil'],
]

// podwojone l w brytyjskim przy -ed / -ing / -er (travelled, cancelling, traveller)
const DOUBLE_L = [
  'travel',
  'cancel',
  'label',
  'level',
  'model',
  'signal',
  'quarrel',
  'marvel',
  'dial',
  'total',
  'equal',
  'jewel',
]

const map = new Map<string, string>(WORDS)
for (const w of OUR) for (const e of OUR_ENDS) map.set(w + e, w.replace(/or$/, 'our') + e)
for (const s of IZE) for (const e of IZE_ENDS) map.set(s + e, s.replace(/z$/, 's') + e)
for (const w of DOUBLE_L) for (const e of ['ed', 'ing', 'er', 'ers']) map.set(w + e, w + 'l' + e)

// zamienia znane amerykańskie słowa na brytyjskie, reszty nie rusza
export function toBritish(s: string) {
  return s.replace(/[a-z]+/g, (w) => map.get(w) ?? w)
}
