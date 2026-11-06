export type StudyWord = { id: string; term: string; definition: string; topic: string }
export type StudyUnit = {
  id: string
  title: string
  detail: string
  href: string
  words: StudyWord[]
  kind?: 'words' | 'map'
  due?: string
}
export const STUDY_UNITS: StudyUnit[] = [
  {
    "id": "science",
    "title": "Science lab",
    "detail": "Is it alive, organization of life, microscopes.",
    "href": "https://brookhouser.github.io/sam-science-game/",
    "words": [
      {
        "id": "autotroph",
        "term": "Autotroph",
        "definition": "An organism that makes its own food, such as a plant that uses light energy to make sugar.",
        "topic": "life"
      },
      {
        "id": "heterotroph",
        "term": "Heterotroph",
        "definition": "An organism that cannot make its own food and gets energy by eating other organisms.",
        "topic": "life"
      },
      {
        "id": "metabolism",
        "term": "Metabolism",
        "definition": "All of the chemical reactions in an organism that use or release energy to carry out life functions.",
        "topic": "life"
      },
      {
        "id": "evolution",
        "term": "Evolution",
        "definition": "Change in the inherited traits of a population over many generations.",
        "topic": "life"
      },
      {
        "id": "biology",
        "term": "Biology",
        "definition": "The scientific study of living things.",
        "topic": "life"
      },
      {
        "id": "slide",
        "term": "Slide",
        "definition": "A thin, flat piece of glass that holds a specimen for viewing under a microscope.",
        "topic": "scope"
      },
      {
        "id": "glass-coverslip",
        "term": "Glass coverslip",
        "definition": "A very thin piece of glass placed over a specimen on a slide to flatten it and protect the lens.",
        "topic": "scope"
      },
      {
        "id": "organism",
        "term": "Organism",
        "definition": "An individual living thing (an individual form of life). Examples: humans, mushrooms, trees, bacteria, sea jellies, and whales.",
        "topic": "levels"
      },
      {
        "id": "biotic",
        "term": "Biotic",
        "definition": "A living part of an environment, such as a plant, animal, or fungus. Example: a person.",
        "topic": "life"
      },
      {
        "id": "abiotic",
        "term": "Abiotic",
        "definition": "A nonliving part of an environment, such as water, air, sunlight, or a rock.",
        "topic": "life"
      },
      {
        "id": "stimulus",
        "term": "Stimulus",
        "definition": "A change in an organism's environment that causes a reaction (something that causes a response). Example: the brightness of the sun.",
        "topic": "life"
      },
      {
        "id": "response",
        "term": "Response",
        "definition": "How an organism reacts to a stimulus. Example: squinting your eyes in bright sun.",
        "topic": "life"
      },
      {
        "id": "respond",
        "term": "Respond",
        "definition": "To react to a change in the environment.",
        "topic": "life"
      },
      {
        "id": "grow",
        "term": "Grow",
        "definition": "To increase in size or number.",
        "topic": "life"
      },
      {
        "id": "growth",
        "term": "Growth",
        "definition": "An increase in mass. It also means an increase in size and in the number of cells.",
        "topic": "life"
      },
      {
        "id": "develop",
        "term": "Develop",
        "definition": "To change over time by becoming more complex or mature.",
        "topic": "life"
      },
      {
        "id": "reproduce",
        "term": "Reproduce",
        "definition": "To produce offspring.",
        "topic": "life"
      },
      {
        "id": "reproduction",
        "term": "Reproduction",
        "definition": "The process of making more of the same kind of organism. Because individual living things eventually die, reproduction allows the species to continue.",
        "topic": "life"
      },
      {
        "id": "unicellular",
        "term": "Unicellular",
        "definition": "Made of one cell.",
        "topic": "life"
      },
      {
        "id": "multicellular",
        "term": "Multicellular",
        "definition": "Made of many cells.",
        "topic": "life"
      },
      {
        "id": "homeostasis",
        "term": "Homeostasis",
        "definition": "The process of keeping stable internal conditions (like body temperature) even when the outside environment changes. In many organisms, organ systems work together to maintain it.",
        "topic": "life"
      },
      {
        "id": "virus",
        "term": "Virus",
        "definition": "A tiny particle that has some characteristics of life but not all of them. For example, it cannot reproduce on its own. Scientists generally do not consider viruses to be living.",
        "topic": "life"
      },
      {
        "id": "cell",
        "term": "Cell",
        "definition": "The smallest unit of a living thing and the simplest structure that can carry out all the life functions (the smallest form of life that can perform all functions of a living organism, like bacteria).",
        "topic": "levels"
      },
      {
        "id": "tissue",
        "term": "Tissue",
        "definition": "A group of similar cells that work together to perform a function.",
        "topic": "levels"
      },
      {
        "id": "organ",
        "term": "Organ",
        "definition": "A structure made of different tissues that works to perform a specific job. Examples: lungs, heart.",
        "topic": "levels"
      },
      {
        "id": "organ-system",
        "term": "Organ system",
        "definition": "A group of organs that work together to complete major body functions.",
        "topic": "levels"
      },
      {
        "id": "eyepiece-ocular-lens",
        "term": "Eyepiece (ocular lens)",
        "definition": "The lens you look through. It magnifies the specimen 10x.",
        "topic": "scope"
      },
      {
        "id": "body-tube",
        "term": "Body tube",
        "definition": "The tube that connects the eyepiece to the revolving nosepiece and objectives.",
        "topic": "scope"
      },
      {
        "id": "revolving-nosepiece",
        "term": "Revolving nosepiece",
        "definition": "Holds the objectives and rotates between the objective lenses.",
        "topic": "scope"
      },
      {
        "id": "low-power-objective",
        "term": "Low-power objective",
        "definition": "The shortest objective lens, 4X. Start here (total magnification 40X).",
        "topic": "scope"
      },
      {
        "id": "medium-power-objective",
        "term": "Medium-power objective",
        "definition": "The 10X objective lens (total magnification 100X).",
        "topic": "scope"
      },
      {
        "id": "high-power-objective",
        "term": "High-power objective",
        "definition": "The longest objective lens, 40X (total magnification 400X). Use only the fine adjustment knob with it.",
        "topic": "scope"
      },
      {
        "id": "stage",
        "term": "Stage",
        "definition": "The flat platform that holds the slide. It has an opening that lets light through.",
        "topic": "scope"
      },
      {
        "id": "stage-clips",
        "term": "Stage clips",
        "definition": "Hold the slide in place on the stage.",
        "topic": "scope"
      },
      {
        "id": "diaphragm",
        "term": "Diaphragm",
        "definition": "Under the stage. It turns to adjust the light and contrast.",
        "topic": "scope"
      },
      {
        "id": "light-source",
        "term": "Light source",
        "definition": "Provides light that shines upward.",
        "topic": "scope"
      },
      {
        "id": "condenser",
        "term": "Condenser",
        "definition": "The part under the stage that focuses light onto the specimen. Center the specimen over it. It sits with the diaphragm, which adjusts the light.",
        "topic": "scope"
      },
      {
        "id": "arm",
        "term": "Arm",
        "definition": "Allows the user to carry the microscope (carry it by the arm and the base).",
        "topic": "scope"
      },
      {
        "id": "base",
        "term": "Base",
        "definition": "Supports the microscope.",
        "topic": "scope"
      },
      {
        "id": "coarse-adjustment-knob",
        "term": "Coarse adjustment knob",
        "definition": "The large knob that makes large focus changes. It raises and lowers the stage.",
        "topic": "scope"
      },
      {
        "id": "fine-adjustment-knob",
        "term": "Fine adjustment knob",
        "definition": "The small knob that makes small focus adjustments. It is the only knob to use at high power.",
        "topic": "scope"
      },
      {
        "id": "lens-tissue",
        "term": "Lens tissue",
        "definition": "Soft, lint-free paper used to clean microscope lenses without scratching them.",
        "topic": "scope"
      },
      {
        "id": "compound-light-microscope",
        "term": "Compound light microscope",
        "definition": "The type of microscope used in most science classes.",
        "topic": "scope"
      },
      {
        "id": "total-magnification",
        "term": "Total magnification",
        "definition": "The ocular (eyepiece) power multiplied by the objective power.",
        "topic": "scope"
      }
    ]
  },
  {
    "id": "cells",
    "title": "Cells and ecosystems",
    "detail": "Organelles, interactions, and how living things share a place.",
    "href": "https://brookhouser.github.io/sam-science-game/cells-ecosystems/",
    "words": [
      {
        "id": "abiotic",
        "term": "Abiotic",
        "definition": "Non-living physical and chemical parts of an environment, such as sunlight, water, rocks, temperature, and soil.",
        "topic": "eco"
      },
      {
        "id": "atp",
        "term": "ATP",
        "definition": "The primary energy-carrying molecule used by cells to do work (often called the cell's energy \"currency\").",
        "topic": "cells"
      },
      {
        "id": "biotic",
        "term": "Biotic",
        "definition": "Living or once-living organisms in an ecosystem, including animals, plants, fungi, and bacteria.",
        "topic": "eco"
      },
      {
        "id": "cell",
        "term": "Cell",
        "definition": "The basic structural and functional unit of all living things; the smallest unit of life.",
        "topic": "cells"
      },
      {
        "id": "cell-membrane",
        "term": "Cell membrane",
        "definition": "A flexible outer barrier that encloses a cell and regulates what enters and leaves.",
        "topic": "cells"
      },
      {
        "id": "commensalism",
        "term": "Commensalism",
        "definition": "A symbiotic relationship where one organism benefits and the other is neither helped nor harmed.",
        "topic": "eco"
      },
      {
        "id": "cytoplasm",
        "term": "Cytoplasm",
        "definition": "The jelly-like fluid that fills the interior of a cell and holds the organelles.",
        "topic": "cells"
      },
      {
        "id": "dna",
        "term": "DNA",
        "definition": "The hereditary molecule that carries the genetic instructions for the growth, development, and reproduction of living things.",
        "topic": "cells"
      },
      {
        "id": "eukaryotic",
        "term": "Eukaryotic",
        "definition": "Describes an organism or cell that contains a nucleus and membrane-bound organelles (e.g., plants, animals, fungi).",
        "topic": "cells"
      },
      {
        "id": "host",
        "term": "Host",
        "definition": "An organism that provides food, shelter, or resources to another organism, such as a parasite.",
        "topic": "eco"
      },
      {
        "id": "mitochondria",
        "term": "Mitochondria",
        "definition": "The \"powerhouses\" of the cell; organelles that convert glucose into cellular energy (ATP) through cellular respiration.",
        "topic": "cells"
      },
      {
        "id": "mutualism",
        "term": "Mutualism",
        "definition": "A symbiotic relationship where both species benefit from the interaction.",
        "topic": "eco"
      },
      {
        "id": "multicellular",
        "term": "Multicellular",
        "definition": "Made up of more than one cell working together (such as humans, trees, and birds).",
        "topic": "cells"
      },
      {
        "id": "nuclear-membrane",
        "term": "Nuclear membrane",
        "definition": "The double-layered barrier that surrounds and protects the nucleus, regulating what passes in and out.",
        "topic": "cells"
      },
      {
        "id": "nucleus",
        "term": "Nucleus",
        "definition": "The control center of a eukaryotic cell that contains its DNA.",
        "topic": "cells"
      },
      {
        "id": "organelle",
        "term": "Organelle",
        "definition": "A tiny, specialized structure inside a cell that carries out a specific function (like an organ inside a body).",
        "topic": "cells"
      },
      {
        "id": "organism",
        "term": "Organism",
        "definition": "Any individual living thing, such as a plant, animal, fungus, or bacterium.",
        "topic": "eco"
      },
      {
        "id": "parasite",
        "term": "Parasite",
        "definition": "An organism that lives on or inside a host organism and benefits by causing harm to the host.",
        "topic": "eco"
      },
      {
        "id": "parasitism",
        "term": "Parasitism",
        "definition": "A symbiotic relationship where one organism (the parasite) benefits while the other (the host) is harmed.",
        "topic": "eco"
      },
      {
        "id": "predator",
        "term": "Predator",
        "definition": "An animal that hunts, captures, and feeds on other animals.",
        "topic": "eco"
      },
      {
        "id": "prey",
        "term": "Prey",
        "definition": "An animal that is hunted and eaten by a predator.",
        "topic": "eco"
      },
      {
        "id": "prokaryotic",
        "term": "Prokaryotic",
        "definition": "Describes a simple, single-celled organism that lacks a nucleus and membrane-bound organelles (such as bacteria).",
        "topic": "cells"
      },
      {
        "id": "ribosomes",
        "term": "Ribosomes",
        "definition": "Tiny cell structures responsible for assembling proteins.",
        "topic": "cells"
      },
      {
        "id": "symbiosis",
        "term": "Symbiosis",
        "definition": "A close, long-term interaction between two different biological organisms living together.",
        "topic": "eco"
      },
      {
        "id": "unicellular",
        "term": "Unicellular",
        "definition": "Made up of only a single cell (such as an amoeba or bacterium).",
        "topic": "cells"
      },
      {
        "id": "vacuole",
        "term": "Vacuole",
        "definition": "A storage sac inside a cell used to store water, nutrients, or waste products.",
        "topic": "cells"
      }
    ]
  },
  {
    "id": "vocab",
    "title": "Size words",
    "detail": "Roots such as micro, macro, mega, and ten.",
    "href": "https://brookhouser.github.io/sam-science-game/vocab-size-words/",
    "words": [
      {
        "id": "attenuate",
        "term": "Attenuate",
        "definition": "To reduce the force, effect, thickness, or value of something; to weaken or make slender.",
        "topic": "thin"
      },
      {
        "id": "comply",
        "term": "Comply",
        "definition": "To act in accordance with a wish, request, rule, or command.",
        "topic": "more"
      },
      {
        "id": "expletive",
        "term": "Expletive",
        "definition": "An oath or swear word; in grammar, a word or phrase that fills out a sentence without adding meaning (such as \"it\" or \"there\" in empty subject positions).",
        "topic": "more"
      },
      {
        "id": "implement",
        "term": "Implement",
        "definition": "To put a decision, plan, or agreement into effect; as a noun, a tool or instrument used for a specific task.",
        "topic": "more"
      },
      {
        "id": "microbe",
        "term": "Microbe",
        "definition": "A microscopic living organism, especially a bacterium, virus, or fungus, particularly one that causes disease or fermentation.",
        "topic": "small"
      },
      {
        "id": "microcosm",
        "term": "Microcosm",
        "definition": "A community, place, or situation regarded as encapsulating in miniature the characteristic qualities or features of something much larger.",
        "topic": "small"
      },
      {
        "id": "minuscule",
        "term": "Minuscule",
        "definition": "Extremely small or tiny.",
        "topic": "small"
      },
      {
        "id": "minutia",
        "term": "Minutia",
        "definition": "Precise, trivial, or minor details (commonly used in the plural, minutiae).",
        "topic": "small"
      },
      {
        "id": "replete",
        "term": "Replete",
        "definition": "Filled or well-supplied with something; gorged or full to satisfaction, especially with food and drink.",
        "topic": "more"
      },
      {
        "id": "satiate",
        "term": "Satiate",
        "definition": "To satisfy a desire, appetite, or need fully, often to the point of excess or boredom.",
        "topic": "more"
      },
      {
        "id": "tenuous",
        "term": "Tenuous",
        "definition": "Very weak, slight, or flimsy; having little substance or basis.",
        "topic": "thin"
      },
      {
        "id": "copious",
        "term": "Copious",
        "definition": "Abundant in supply, quantity, or volume; plentiful.",
        "topic": "more"
      },
      {
        "id": "macrocosm",
        "term": "Macrocosm",
        "definition": "The whole of a complex structure, such as the universe or society, contrasted with a smaller or representative part of it.",
        "topic": "great"
      },
      {
        "id": "magnanimous",
        "term": "Magnanimous",
        "definition": "Generous, forgiving, and noble in spirit, especially toward a rival or someone less powerful.",
        "topic": "great"
      },
      {
        "id": "magnate",
        "term": "Magnate",
        "definition": "A wealthy, influential, and powerful person, especially in a specific business or industry (such as a real estate or oil tycoon).",
        "topic": "great"
      },
      {
        "id": "magnitude",
        "term": "Magnitude",
        "definition": "The great size, extent, importance, or scale of something; in science, a numerical measure of brightness or earthquake energy.",
        "topic": "great"
      },
      {
        "id": "megalomania",
        "term": "Megalomania",
        "definition": "An obsession with the exercise of power, especially in the domination of others; a delusional belief in one's own greatness or importance.",
        "topic": "great"
      },
      {
        "id": "polygamy",
        "term": "Polygamy",
        "definition": "The practice or custom of having more than one spouse at the same time.",
        "topic": "poly"
      },
      {
        "id": "polygon",
        "term": "Polygon",
        "definition": "A flat, two-dimensional geometric shape with at least three straight sides and angles.",
        "topic": "poly"
      }
    ]
  },
  {
    "id": "west",
    "title": "West Africa",
    "detail": "Lessons 11 and 12: trade, cities, and kingdoms.",
    "href": "https://brookhouser.github.io/sam-science-game/west-africa/",
    "words": [
      {
        "id": "artifact",
        "term": "artifact",
        "definition": "An item left behind by an earlier culture. Iron tools and iron-smelting furnaces are artifacts of the Nok.",
        "topic": "grow"
      },
      {
        "id": "jenne-jeno",
        "term": "Jenne-jeno",
        "definition": "An ancient West African city where the Niger River meets the Bani River. It was built in the third century B.C.E. and lasted more than 1,600 years.",
        "topic": "grow"
      },
      {
        "id": "niger-river",
        "term": "Niger River",
        "definition": "The longest river in West Africa. In early times it was a kind of trading highway. People traveled it by canoe.",
        "topic": "geo"
      },
      {
        "id": "nok",
        "term": "Nok",
        "definition": "A people who lived in what is now central Nigeria. By the 500s B.C.E. they made iron tools.",
        "topic": "grow"
      },
      {
        "id": "sahara",
        "term": "Sahara",
        "definition": "A large, hot desert in North Africa. It covers about 3.5 million square miles.",
        "topic": "geo"
      },
      {
        "id": "sahel",
        "term": "Sahel",
        "definition": "A zone of semidesert just south of the Sahara, where short grasses, small bushes, and a few trees grow.",
        "topic": "geo"
      },
      {
        "id": "savanna",
        "term": "savanna",
        "definition": "A vegetation zone of tall grasses and scattered trees. It has a long rainy season.",
        "topic": "geo"
      },
      {
        "id": "smelting",
        "term": "smelting",
        "definition": "The process of melting ore to extract iron or other metals.",
        "topic": "grow"
      },
      {
        "id": "tribute",
        "term": "tribute",
        "definition": "A payment made by one ruler or country to another for protection, or as a sign of submission.",
        "topic": "king"
      },
      {
        "id": "ghana",
        "term": "Ghana",
        "definition": "A medieval kingdom and empire in West Africa. It lasted from sometime before 500 C.E. until it finally collapsed in the 1200s. The word ghana means \"war chief.\"",
        "topic": "ghana"
      },
      {
        "id": "matrilineal",
        "term": "matrilineal",
        "definition": "A family line traced through the mother. In Ghana the king's own son did not inherit the throne. The son of the king's sister did.",
        "topic": "ghana"
      },
      {
        "id": "trans-saharan-trade",
        "term": "trans-Saharan trade",
        "definition": "Trade between peoples north and south of the Sahara.",
        "topic": "trade"
      },
      {
        "id": "extended-family",
        "term": "extended family",
        "definition": "A farming community of close relatives, such as grandparents, aunts, uncles, and cousins. Early ones south of the Sahara had about 15 to 20 members.",
        "topic": "grow"
      },
      {
        "id": "blacksmith",
        "term": "blacksmith",
        "definition": "A skilled worker who hammered red-hot iron into tools and weapons. In Jenne-jeno, blacksmiths were the most respected people.",
        "topic": "grow"
      },
      {
        "id": "wangara",
        "term": "Wangara",
        "definition": "The secret gold country south of Ghana. The Wangarans never revealed where their mines were.",
        "topic": "trade"
      },
      {
        "id": "taghaza",
        "term": "Taghaza",
        "definition": "A Sahara village where salt was mined. Traders stopped there to load blocks of salt.",
        "topic": "trade"
      },
      {
        "id": "kumbi",
        "term": "Kumbi",
        "definition": "The capital of Ghana. It had the busiest market in West Africa.",
        "topic": "ghana"
      },
      {
        "id": "silent-barter",
        "term": "silent barter",
        "definition": "Trading without speaking or meeting. Wangarans and caravan traders left goods and gold dust by a river and signaled with drums.",
        "topic": "trade"
      },
      {
        "id": "almoravids",
        "term": "Almoravids",
        "definition": "Muslim warriors who attacked Ghana in the second half of the 11th century and captured Kumbi.",
        "topic": "ghana"
      },
      {
        "id": "mande",
        "term": "Mande",
        "definition": "A people whose homeland, Mali, lay south of Kumbi, closer to the Niger River. Around 1240 they conquered Kumbi and built a new empire.",
        "topic": "ghana"
      },
      {
        "id": "ibn-battuta",
        "term": "Ibn Battuta",
        "definition": "A Muslim historian and traveler. In 1352 he crossed the Sahara with a trade caravan and wrote about the journey.",
        "topic": "trade"
      },
      {
        "id": "camel",
        "term": "camel",
        "definition": "An animal Arab traders brought to the Sahara around 300 C.E. A camel can drink up to 25 gallons of water at a time, so it can walk for days in the desert.",
        "topic": "trade"
      },
      {
        "id": "cowrie-shell",
        "term": "cowrie shell",
        "definition": "A kind of seashell from North Africa. Traders used cowrie shells as money.",
        "topic": "trade"
      },
      {
        "id": "porter",
        "term": "porter",
        "definition": "A person who carries goods for a living. At Walata, traders moved salt and other goods from camels onto donkeys and porters.",
        "topic": "trade"
      },
      {
        "id": "empire",
        "term": "empire",
        "definition": "What a kingdom became when its king conquered more land. The king might send a governor to rule a conquered area, or let the people rule themselves.",
        "topic": "king"
      }
    ]
  }
]

export function unitById(id: string): StudyUnit | undefined { return STUDY_UNITS.find((unit) => unit.id === id) }
