import {
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiBriefcase,
  FiTag,
  FiGrid,
  FiScissors,
  FiTruck,
  FiHeart,
  FiBook,
  FiTool,
  FiCamera,
} from "react-icons/fi";
import {
  FaUtensils,
  FaBed,
  FaCoffee,
  FaBirthdayCake,
  FaShoppingBasket,
  FaPills,
  FaStethoscope,
  FaTooth,
  FaDumbbell,
  FaCut,
  FaSpa,
  FaGraduationCap,
  FaBook,
  FaPrint,
  FaMobileAlt,
  FaLaptopCode,
  FaBolt,
  FaWrench,
  FaCar,
  FaTruck,
  FaPlane,
  FaTaxi,
  FaHammer,
  FaCouch,
  FaPaintRoller,
  FaBuilding,
  FaHome,
  FaRupeeSign,
  FaShieldAlt,
  FaGem,
  FaTshirt,
  FaShoePrints,
  FaCamera,
  FaGlassCheers,
  FaMusic,
  FaBalanceScale,
  FaPaw,
  FaSeedling,
  FaGift,
  FaStore,
  FaBriefcase,
  FaBullhorn,
  FaTint,
  FaBroom,
  FaPray,
  FaHandsHelping,
  FaFilm,
  FaFutbol,
  FaGasPump,
  FaBus,
  FaSnowflake,
  FaBoxOpen,
  FaGlasses,
  FaBeer,
  FaAmbulance,
  FaChalkboardTeacher,
} from "react-icons/fa";

export const CATEGORY_ICONS = [
  FiShoppingBag,
  FiCoffee,
  FiHome,
  FiBriefcase,
  FiTag,
  FiGrid,
  FiScissors,
  FiTruck,
  FiHeart,
  FiBook,
  FiTool,
  FiCamera,
];

const KEYWORD_ICONS = [
  [/\b(dental|dentist|tooth|teeth|orthodont)/, FaTooth],
  [/\b(optical|optician|eyes?|spectacle|glasses|vision)/, FaGlasses],
  [/\b(ambulance|emergency|blood bank)/, FaAmbulance],
  [/\b(petrol|diesel|fuel|gas|lpg|bunk)\b/, FaGasPump],
  [/\b(bus|buses|trains?|railway|metro|omni)\b/, FaBus],
  [/\b(bars?|pubs?|wine|wines|liquor|brew|brewery|beer|toddy)\b/, FaBeer],
  [/\b(air ?condition|acs?|refrigerat|cooling|freezer|fridge)/, FaSnowflake],
  [/\b(packag|plastic|carton|boxes|container)/, FaBoxOpen],
  [
    /\b(tutor|teacher|typing|spoken|language|ielts|abacus)/,
    FaChalkboardTeacher,
  ],
  [/\b(pharmac|medical shop|medicine|chemist|drug)/, FaPills],
  [
    /\b(hospital|clinic|doctor|health|diagnos|scan|laborator|physio|ayurved|nursing|medic|surgeon|therap)/,
    FaStethoscope,
  ],
  [
    /\b(hotel|restaurant|food|mess|canteen|dining|eatery|biryani|meals|tiffin|catering|kitchen|dhaba|fast food|mandi|grill|pizza|burger)/,
    FaUtensils,
  ],
  [
    /\b(lodge|lodging|resort|hostel|guest ?house|homestay|accommodation|stay|rooms?)\b/,
    FaBed,
  ],
  [/\b(cafe|coffee|tea|juice|beverage|shake)/, FaCoffee],
  [
    /\b(bakery|bakeries|cake|sweet|snack|dessert|ice ?cream|chocolate)/,
    FaBirthdayCake,
  ],
  [
    /\b(grocer|supermarket|provision|kirana|vegetable|fruit|dairy|milk|meat|fish|chicken|mutton|egg)/,
    FaShoppingBasket,
  ],
  [/\b(gym|fitness|yoga|zumba|workout|crossfit)/, FaDumbbell],
  [/\b(sport|cricket|football|badminton|turf|play ?ground)/, FaFutbol],
  [/\b(salon|barber|hair|parlou?r|trimming)/, FaCut],
  [/\b(beauty|spa|massage|makeup|cosmetic|skin|bridal)/, FaSpa],
  [
    /\b(school|college|tuition|coaching|education|academy|training|institute|course|class|kinder|learning|university)/,
    FaGraduationCap,
  ],
  [/\b(book|stationer|library|publication|publisher|notebook)/, FaBook],
  [/\b(print|xerox|flex|banner|digital press|photocopy)/, FaPrint],
  [/\b(photo|video|studio|camera|album|drone)/, FaCamera],
  [/\b(mobile|phone|smartphone|cell ?phone|recharge)/, FaMobileAlt],
  [
    /\b(computer|laptop|software|tech|web|digital|it |cctv|network|internet|app|developer|cyber|data)/,
    FaLaptopCode,
  ],
  [/\b(electric|electronic|inverter|battery|solar|wiring|appliance)/, FaBolt],
  [/\b(taxi|cab|cabs|ride|driver)/, FaTaxi],
  [/\b(travel|tour|ticket|holiday|trip|visa|airline|flight)/, FaPlane],
  [
    /\b(transport|logistic|courier|cargo|packers|movers|lorry|parcel|shipping|delivery|freight)/,
    FaTruck,
  ],
  [
    /\b(cars?|autos?|automobiles?|bikes?|two ?wheelers?|vehicles?|showrooms?|tyres?|tires?|driving|motors?|garage|service cent(er|re))\b/,
    FaCar,
  ],
  [
    /\b(plumb|hardware|repair|mechanic|workshop|welding|fabricat|lathe|tools?)/,
    FaWrench,
  ],
  [/\b(water|purifier|ro |aqua|borewell)/, FaTint],
  [
    /\b(construction|builder|contractor|civil|cement|steel|roofing|bricks?|sand|concrete|engineer)/,
    FaHammer,
  ],
  [/\b(furniture|interior|carpent|sofa|mattress|wood|decor)/, FaCouch],
  [/\b(paint|painting|coating)/, FaPaintRoller],
  [
    /\b(real ?estate|property|plot|land|apartment|flat|rental|realty|promoter)/,
    FaBuilding,
  ],
  [/\b(house|home|villa)/, FaHome],
  [
    /\b(bank|finance|loan|invest|chit|money|account|audit|tax|gst|stock|mutual)/,
    FaRupeeSign,
  ],
  [/\b(insurance|security|guard|safety|surveillance)/, FaShieldAlt],
  [/\b(jewel|gold|silver|diamond|ornament)/, FaGem],
  [/\b(shoe|footwear|chappal|sandal|slipper)/, FaShoePrints],
  [
    /\b(cloth|garment|textile|fashion|boutique|tailor|saree|dress|apparel|wear|fabric|uniform|laundry|dry ?clean)/,
    FaTshirt,
  ],
  [
    /\b(event|party|hall|function|wedding|marriage|reception|celebration|banquet)/,
    FaGlassCheers,
  ],
  [/\b(music|dj|sound|band|instrument|dance|singing)/, FaMusic],
  [
    /\b(movie|cinema|theatre|theater|film|game|gaming|amusement|entertain|park)/,
    FaFilm,
  ],
  [/\b(lawyer|advocate|legal|law|notary|court)/, FaBalanceScale],
  [/\b(pet|veterinar|animal|dog|cat|aquarium)/, FaPaw],
  [
    /\b(agri|farm|seed|fertili[sz]er|nursery|plant|garden|flower|florist|organic)/,
    FaSeedling,
  ],
  [/\b(gift|toy|novelty|fancy|balloon)/, FaGift],
  [/\b(clean|housekeeping|pest|sanit|maid)/, FaBroom],
  [
    /\b(temple|church|mosque|pooja|puja|astro|religio|priest|spiritual)/,
    FaPray,
  ],
  [
    /\b(ngo|charity|trust|community|social|foundation|volunteer)/,
    FaHandsHelping,
  ],
  [/\b(market|advertis|promotion|branding|media|seo)/, FaBullhorn],
  [
    /\b(consult|agency|business|management|recruit|job|placement|hr |office|service)/,
    FaBriefcase,
  ],
  [
    /\b(shop|store|retail|general|mart|wholesale|trading|trader|super|bazaar|emporium|collection)/,
    FaStore,
  ],
];

export function getCategoryIcon(category) {
  const name = `${category?.name || ""} ${category?.slug || ""}`
    .toLowerCase()
    .replace(/[-_&/]+/g, " ")
    .trim();
  if (name) {
    for (const [pattern, Icon] of KEYWORD_ICONS) {
      if (pattern.test(name)) return Icon;
    }
  }
  return FaStore;
}
