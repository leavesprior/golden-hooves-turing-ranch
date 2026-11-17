// Ranch guest guide content. BENCH 2026-11-09.
// Tour text = the room cards Leif approved and that are live on WelcomeScreen (2026-11-06),
// word for word (ROOM_CARDS_DRAFT.md). Airbnb's 11-20 rule: the guide may repeat listing
// requests, never add new ones. Do not add requests here.
// Mystery story = DRAFT by Neoma for Leif's yes (_conf=0). Nothing copied from Myst, Riven
// or the QR Clue vendor: their names, art, places, puzzles and story stay theirs.

window.RANCH = {
  contactHost: 'Message your host in the Airbnb app. Leif answers there.',

  // ---------------------------------------------------------------- the tour
  // season: 'all' | 'cold' (Nov-Mar) | 'warm' (Apr-Oct). A cold-only line never blocks a July guest.
  stations: [
    { id: 'living', title: 'Living room', icon: '🪵', photos: ['room_31.jpg', 'room_04.jpg'],
      notice: 'Find the wood stove and the baby grand piano.',
      comfort: [
        { season: 'all', text: 'The main living room, with the wood stove and the baby grand piano. Two of the downstairs bedrooms are right next to it.' },
        { season: 'cold', text: 'The wood stove keeps the house warm as long as somebody feeds it. In the cold months, send your arrival time and it will be going when you get here. Never leave a fire unattended.' },
      ] },
    { id: 'sunroom', title: 'Sunroom', icon: '🌱', photos: ['room_03.jpg'],
      notice: 'Stand in the greenhouse sunroom and look for the upper lake.',
      comfort: [{ season: 'all', text: 'The greenhouse sunroom across the front of the house. A front-row seat for the big storms, warm on the inside, with the forest and the upper lake in view.' }] },
    { id: 'kitchen', title: 'Kitchen and dining', icon: '🍳', photos: ['room_08.jpg'],
      notice: 'Find the kitchen bar, where the cook keeps company.',
      comfort: [{ season: 'all', text: 'A real kitchen, for cooking real meals together. The kitchen bar keeps the cook company, and the dining room has windows on two sides and room for everyone at one table.' }] },
    { id: 'hottub', title: 'Hot tub', icon: '🛁', photos: ['room_01.jpg'],
      notice: 'Find the glass gazebo just below the deck.',
      comfort: [
        { season: 'all', text: 'The private hot tub sits in its own glass gazebo, just below the deck. It is best at night or in a storm, with the forest right outside the glass.' },
        { season: 'all', text: 'Mind your head if you are tall. The fan and light switches are just inside the door on the left, up high.' },
        { season: 'all', text: 'The cover takes two people. Put it back on when you are done, to keep the heat in.' },
        { season: 'all', text: 'To start the jets, use the two horizontal buttons furthest to the right, one at a time, about 45 seconds apart.' },
        { season: 'all', text: 'Rinse off lotions and oils first. No glass. Children only with an adult.' },
      ] },
    { id: 'gameroom', title: 'Game room', icon: '🎱', photos: ['room_06.jpg'],
      notice: 'Find the hand-carved pool table.',
      comfort: [
        { season: 'all', text: 'A hand-carved pool table, a bar, a mini fridge, and a TV with Roku. Heated in winter, with big windows looking straight out into the trees.' },
        { season: 'all', text: "Please don't lock the door between the game room and the house." },
      ] },
    { id: 'bedrooms', title: 'Bedrooms', icon: '🛏️', photos: ['room_09.jpg', 'room_24.jpg', 'room_23.jpg'],
      notice: 'Six bedrooms. Can you find the one with the classic TV and the VHS player?',
      comfort: [
        { season: 'all', text: 'The master has a carved four-poster, its own bath and vanity, and a private deck with morning coffee and a view of the upper lake.' },
        { season: 'all', text: 'Upstairs is the Angel Room, with a queen bed.' },
        { season: 'all', text: 'The pink room has a full bed, a view of the upper lake, and a classic TV with a VHS player and a small movie library.' },
        { season: 'all', text: 'Downstairs is a room with western pictures on the walls.' },
      ] },
    { id: 'deck', title: 'Deck and grill', icon: '🔥', photos: ['room_10.jpg'],
      notice: 'Step out on the big deck.',
      comfort: [{ season: 'all', text: 'The big deck and the hot tub gazebo. Outside there is a Traeger smoker, a charcoal grill, a fire pit, and a covered table for eating outside. Never leave a fire unattended.' }] },
    { id: 'lakes', title: 'Lakes and trails', icon: '🦆', photos: ['room_13.jpg', 'room_16.jpg'],
      notice: 'Look for the little island in the upper lake.',
      comfort: [
        { season: 'all', text: 'The upper lake and its little island are in view of the house. Mallards and great blue herons stop by.' },
        { season: 'all', text: "Walking trails loop around about half of the ranch's 60 acres, out along the lower lake, where Gold Rush miners once worked the creeks." },
        { season: 'all', text: 'The lakes are at your own risk. Please keep the gates closed.' },
      ],
      // A choice whose good/bad karma is hidden (Leif 11-09). Both options give the SAME neutral, so the
      // shown number gives nothing away. Facts on record: donkeys on the ranch; "ask before feeding".
      choice: { prompt: 'On your walk, the donkeys come to the fence to see you. You have a snack in your pocket.',
        options: [
          { label: 'Share your snack with them', karma: { neutral: 1, good: 0, bad: 2 } },
          { label: 'Say hello, and ask the host before feeding', karma: { neutral: 1, good: 2, bad: 0 } },
        ],
        after: 'The ranch asks guests to ask before feeding the animals.' } },
  ],

  // ------------------------------------------------------------- the mystery
  // DRAFT story (_conf=0, Leif to approve). Built on the ranch canon line in the game data:
  // "The guest book already has names that do not match the faces."
  // Props are Leif's physical props. Where each one sits is set on host.html (never here),
  // so this file never gives away a hiding place. The prop itself is the check:
  // the phone never holds a lock code.
  mystery: {
    title: 'The Guest Book Out of Time',
    intro: [
      'The ranch keeps a guest book. Most names are yours, and other guests like you.',
      'One page is dated 1849, in a hand nobody here knows. It says the writer came up the ridge to a trading post, stayed one night, and left a few things behind to find the way home again.',
      'The things are still in the house. Each one holds a piece of the page. Find them in any order you like, and take your time. There is no clock and nothing to lose.',
    ],
    clues: [
      { id: 'start', prop: 'The start stand', story: 'The first thing the traveler set down, where anyone coming in would see it.' },
      { id: 'frame', prop: 'The picture frame', story: 'A face in a frame. The traveler wrote: "It watched me the whole night. It knows where I went next."' },
      { id: 'coasters', prop: 'The four coasters', story: 'Four rounds that belong together. The traveler counted them twice.' },
      { id: 'candle', prop: 'The candle', story: 'Light enough to read by, if the power fails on the ridge.' },
      { id: 'uvlight', prop: 'The small light', story: 'Some writing only shows in the right light.' },
      { id: 'key', prop: 'The small key', story: 'Small, and easy to lose. The traveler hid it somewhere practical.' },
      { id: 'dictionary', prop: 'The dictionary', story: 'Words, and a lock. The key you found may fit.' },
      { id: 'cryptex', prop: 'The letter lock', story: 'The last thing. The letters you gathered open it.', finale: true },
    ],
    ending: [
      'The page is whole again. The traveler made it home, one plane over, and left a way for you to follow.',
      'Your Gold Country guide is open: real towns nearby, their real history, and a few more pages hidden out there.',
    ],
  },
};
