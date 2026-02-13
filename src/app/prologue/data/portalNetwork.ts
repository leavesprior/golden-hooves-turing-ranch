// The Ancient Portal Network
// A network of real archaeological sites reinterpreted as nodes in a
// continent-spanning transportation/communication system.
// Bronze-tier game fiction layered over gold-tier real archaeology.

export interface PortalSite {
  id: string
  name: string
  realMystery: string
  gameInterpretation: string
  coordinates: { lat: number; lng: number }
  connectedSites: string[]
  activationRequirement: string
  character: string
}

export const PORTAL_SITES: PortalSite[] = [
  {
    id: 'serpent_mound',
    name: 'Serpent Mound (Power Source)',
    realMystery:
      'A 1,348-foot effigy mound built on an ancient cryptoexplosion structure (likely a meteor impact site). The serpent aligns with solstice and equinox events. Its construction date is debated: Fort Ancient culture (1070 CE) or Adena culture (300 BCE). The geological anomaly beneath it produces unusual magnetic readings.',
    gameInterpretation:
      'The Serpent Mound sits atop a natural energy well created by the ancient meteor impact. The effigy was built not as art but as a focusing mechanism — the serpent shape channels geological energy upward through its coils and out through its open jaws. The "egg" it appears to swallow is actually an energy containment vessel. When activated, the mound produces a low harmonic vibration detectable at other portal sites across the continent. It is, in essence, the battery.',
    coordinates: { lat: 39.025, lng: -83.4309 },
    connectedSites: ['cahokia', 'chaco_canyon'],
    activationRequirement:
      'Must be activated during a solstice alignment. Soaring Hawk uses Dream Walking to perceive the energy flow and "tune" the serpent by placing offerings at specific coil points. The activation sequence corresponds to the astronomical alignments built into the mound.',
    character: 'native',
  },

  {
    id: 'cahokia',
    name: 'Cahokia (Network Hub)',
    realMystery:
      'The largest pre-Columbian city north of Mexico, featuring 120+ mounds, a solar calendar (Woodhenge), and evidence of continent-wide trade networks reaching from the Great Lakes to the Gulf of Mexico. Its rapid rise around 1050 CE and mysterious abandonment by 1400 CE remain unexplained. Monks Mound contains internal stone structures whose purpose is unknown.',
    gameInterpretation:
      'Cahokia is the central switching station of the portal network. Monks Mound was constructed around a natural nexus point where multiple energy channels converge — its massive earthen bulk serves as insulation and amplification, like a gigantic tuning fork made of dirt. Woodhenge is not merely a solar calendar but a control interface: the positions of its posts correspond to network nodes, and the shadows they cast at specific times activate connections to different portal sites. Cahokia\'s rapid growth was driven by the discovery of the nexus; its abandonment occurred when the network began to fail.',
    coordinates: { lat: 38.6607, lng: -90.0622 },
    connectedSites: ['serpent_mound', 'chaco_canyon', 'teotihuacan'],
    activationRequirement:
      'Requires a Woodhenge alignment ceremony at dawn during the equinox. Soaring Hawk must position ceremonial posts at the correct angles while Erik contributes a Norse navigation stone that resonates with the buried nexus crystal within Monks Mound. Both characters must be present — the network hub requires multiple cultural frequencies to operate at full capacity.',
    character: 'native',
  },

  {
    id: 'chaco_canyon',
    name: 'Chaco Canyon (Waypoint)',
    realMystery:
      'A complex of massive stone buildings (Great Houses) in the New Mexico desert, connected by an extensive network of perfectly straight roads that go nowhere useful and seem to serve no practical transportation purpose. The "Sun Dagger" petroglyph marks solstices and equinoxes with a beam of light through two rock slabs. The Great Houses contain hundreds of rooms but show minimal evidence of permanent habitation.',
    gameInterpretation:
      'The roads DO go somewhere — they are surface markings of underground energy channels, like painting arrows on the floor of a subway system. The Great Houses are relay stations, not residences: their precisely oriented rooms amplify and redirect portal energy along the road network. The Sun Dagger is a calibration tool for timing portal activations. Chaco functions as a waypoint, boosting signals between the eastern hub (Cahokia) and western sites. Its "roads to nowhere" are, in fact, roads to everywhere — if you know the frequency.',
    coordinates: { lat: 36.06, lng: -107.9612 },
    connectedSites: ['cahokia', 'puma_punku', 'nazca'],
    activationRequirement:
      'The Sun Dagger must cast its light at the precise solstice moment while a signal is relayed from Cahokia. Califia\'s Chumash star chart contains the calibration frequencies encoded in the navigation notation — patterns that match the road alignments when viewed from above. She must "sing" the star routes in the Chumash navigational chant tradition while standing in the correct Great House room.',
    character: 'califia',
  },

  {
    id: 'puma_punku',
    name: 'Puma Punku (Manufacturing)',
    realMystery:
      'A temple complex near Tiwanaku featuring megalithic stone blocks cut with extraordinary precision. H-shaped blocks appear modular, suggesting standardized construction. The stones include perfectly drilled holes and internal channels whose purpose is debated. Some blocks weigh over 100 tons and were transported from quarries miles away. Construction is dated to approximately 536 CE.',
    gameInterpretation:
      'Puma Punku is the manufacturing center of the portal network — the place where portal components were fabricated. The H-shaped blocks are not building materials but network nodes: standardized, modular, designed to be shipped to portal sites across the continent and slotted into place. The internal channels carried harmonic energy. The precision cutting was not decorative but functional: tolerances had to be exact for resonance to propagate correctly. The site manufactured the physical infrastructure of the network, and its modular design meant replacement parts could be produced as nodes degraded over centuries.',
    coordinates: { lat: -16.5617, lng: -68.6808 },
    connectedSites: ['chaco_canyon', 'nazca', 'teotihuacan'],
    activationRequirement:
      'Yachay must decode the manufacturing instructions encoded in the ancient quipu found at Tiwanaku. The quipu contains resonance frequencies, dimensional specifications, and an activation sequence written in the pre-Incan knot language. By "playing" the quipu like an instrument — plucking strings in the correct order — Yachay generates the harmonic pattern that awakens the dormant H-blocks, which begin to vibrate at their manufactured frequency for the first time in centuries.',
    character: 'incan',
  },

  {
    id: 'nazca',
    name: 'Nazca Lines (Aerial Markers)',
    realMystery:
      'Enormous geoglyphs visible only from the air, carved into the Peruvian desert between 500 BCE and 500 CE. Figures include a spider, monkey, hummingbird, and various geometric shapes. Many lines point to water sources or align with astronomical events. The desert\'s stable, windless conditions have preserved them for millennia.',
    gameInterpretation:
      'The Nazca Lines are the network\'s aerial interface — signal markers designed to be read from above by the portal energy itself, which propagates through the upper atmosphere. Each figure represents a different network function: the spider is a routing symbol (eight legs, eight primary connections), the monkey\'s spiral tail is a frequency modulator, the hummingbird indicates a high-speed connection, and the geometric shapes are literal circuit diagrams. The lines pointing to water sources are not coincidental — water conducts the harmonic energy underground from the aerial markers to subterranean channels. Nazca is where the sky network meets the earth network.',
    coordinates: { lat: -14.7392, lng: -75.13 },
    connectedSites: ['puma_punku', 'chaco_canyon'],
    activationRequirement:
      'The lines must be "read" in the correct sequence during a specific astronomical alignment. Yachay\'s quipu cipher skills allow decoding the figure sequence (spider-monkey-hummingbird is the boot sequence). However, reading requires elevation — Califia\'s scouts, trained in the Chumash mountain-observation tradition, must climb to a specific peak where the figures become visible and call out the sequence via signal fires to Yachay on the desert floor.',
    character: 'incan',
  },

  {
    id: 'teotihuacan',
    name: 'Teotihuacan (Activation Site)',
    realMystery:
      'A massive city built around 100 BCE, abandoned by 550 CE, and already ancient ruins when the Aztecs found it and named it "the place where gods were born." The Pyramid of the Sun sits atop a natural cave system. The Avenue of the Dead appears to map the solar system. Sheets of mica (an electrical insulator) were built into structures for no apparent architectural reason. Mercury pools have been found beneath the Temple of the Feathered Serpent.',
    gameInterpretation:
      'Teotihuacan is the master activation site — the place where the entire portal network can be brought online simultaneously. The Pyramid of the Sun\'s cave is the original nexus point where the network was first conceived. The mica sheets are electrical insulation protecting the pyramid\'s internal resonance chambers from energy bleed. The mercury pools beneath the Temple of the Feathered Serpent are liquid conductors in the network\'s central switching mechanism. The Avenue of the Dead maps not the solar system but the portal network itself: each structure along its length corresponds to a network node. To activate the full network, all sites must be online and their signals must converge here, where the mercury pools amplify and distribute the combined harmonic across the continent.',
    coordinates: { lat: 19.6925, lng: -98.8438 },
    connectedSites: ['cahokia', 'puma_punku'],
    activationRequirement:
      'All four characters must contribute simultaneously during the convergence chapter. Erik provides the Norse lodestone attuned to magnetic north. Soaring Hawk channels Cahokia\'s earth energy through Dream Walking. Califia provides the star chart frequencies that calibrate the aerial network. Yachay activates the mercury pools using the master quipu sequence. When all four frequencies harmonize in the cave beneath the Pyramid of the Sun, the network activates for the first time in centuries — briefly, brilliantly, and with consequences none of them anticipated.',
    character: 'native',
  },
]

export function getPortalSite(id: string): PortalSite | undefined {
  return PORTAL_SITES.find((site) => site.id === id)
}

export function getConnectedSites(siteId: string): PortalSite[] {
  const site = getPortalSite(siteId)
  if (!site) return []
  return PORTAL_SITES.filter((s) => site.connectedSites.includes(s.id))
}

export function getPortalSitesForCharacter(characterId: string): PortalSite[] {
  return PORTAL_SITES.filter((site) => site.character === characterId)
}

export function getFullNetwork(): {
  nodes: PortalSite[]
  edges: [string, string][]
} {
  const nodes = PORTAL_SITES
  const edgeSet = new Set<string>()
  const edges: [string, string][] = []

  for (const site of PORTAL_SITES) {
    for (const connectedId of site.connectedSites) {
      const edgeKey = [site.id, connectedId].sort().join('--')
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push([site.id, connectedId])
      }
    }
  }

  return { nodes, edges }
}
