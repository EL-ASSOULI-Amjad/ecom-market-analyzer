
// ── Mock data for AI Market Analyzer ──────────────────────────────────────────

window.MOCK_PRODUCTS = [
  {
    id: 1, name: "Écouteurs Sans-Fil Pro X", category: "Tech", image: null,
    avgPrice: 89.99, margin: 42, demand: 94, score: 92, badge: "trending",
    competition: "Moyenne", seasonality: "Annuel", trend: "+18%",
    sellers: 127, stock: 45, stockReco: 120, restock: "3j", color: "red",
    priceHistory: [72,75,78,80,83,85,87,88,88,89,90,89.99],
    demandHistory: [60,65,70,72,78,82,88,90,91,93,94,94],
    keywords: ["écouteurs bluetooth", "true wireless", "noise cancelling", "ANC earbuds"],
    demographics: { "18-24": 28, "25-34": 41, "35-44": 19, "45+": 12 },
    stores: { amazon: 94, shopify: 78, ebay: 65, woo: 55 },
    description: "Écouteurs intra-auriculaires avec réduction active du bruit, autonomie 30h"
  },
  {
    id: 2, name: "Crème Visage Hyaluronique", category: "Beauté", image: null,
    avgPrice: 34.50, margin: 68, demand: 88, score: 89, badge: "bestseller",
    competition: "Élevée", seasonality: "Annuel", trend: "+12%",
    sellers: 312, stock: 230, stockReco: 180, restock: "5j", color: "green",
    priceHistory: [28,29,30,31,32,33,34,34,34.5,34.5,34.5,34.5],
    demandHistory: [70,72,75,77,80,82,84,86,87,88,88,88],
    keywords: ["crème hydratante", "acide hyaluronique", "soin visage", "anti-âge"],
    demographics: { "18-24": 22, "25-34": 35, "35-44": 28, "45+": 15 },
    stores: { amazon: 91, shopify: 85, ebay: 48, woo: 72 },
    description: "Crème hydratante intense à l'acide hyaluronique, 50ml, tous types de peau"
  },
  {
    id: 3, name: "Lampe LED Bureau Tactile", category: "Maison", image: null,
    avgPrice: 45.00, margin: 55, demand: 76, score: 81, badge: "opportunity",
    competition: "Faible", seasonality: "Hiver", trend: "+8%",
    sellers: 54, stock: 80, stockReco: 95, restock: "7j", color: "orange",
    priceHistory: [38,39,40,41,42,43,44,44,45,45,45,45],
    demandHistory: [50,52,55,58,62,65,68,70,73,75,76,76],
    keywords: ["lampe bureau", "LED tactile", "lumière réglable", "home office"],
    demographics: { "18-24": 18, "25-34": 44, "35-44": 26, "45+": 12 },
    stores: { amazon: 79, shopify: 82, ebay: 60, woo: 68 },
    description: "Lampe de bureau LED tactile, 3 températures, intensité réglable, port USB"
  },
  {
    id: 4, name: "Legging Sport Gainant", category: "Mode", image: null,
    avgPrice: 29.99, margin: 72, demand: 91, score: 90, badge: "trending",
    competition: "Moyenne", seasonality: "Annuel", trend: "+22%",
    sellers: 189, stock: 120, stockReco: 250, restock: "2j", color: "red",
    priceHistory: [22,23,24,25,26,27,28,28,29,29,29.99,29.99],
    demandHistory: [65,68,72,76,80,84,87,89,90,91,91,91],
    keywords: ["legging sport", "gainant", "yoga pants", "fitness leggings"],
    demographics: { "18-24": 38, "25-34": 42, "35-44": 15, "45+": 5 },
    stores: { amazon: 88, shopify: 92, ebay: 55, woo: 78 },
    description: "Legging gainant haute-taille, tissu compressif, 4 coloris disponibles"
  },
  {
    id: 5, name: "Carnet Bullet Journal A5", category: "Papeterie", image: null,
    avgPrice: 18.90, margin: 80, demand: 72, score: 77, badge: "opportunity",
    competition: "Faible", seasonality: "Rentrée", trend: "+5%",
    sellers: 38, stock: 350, stockReco: 200, restock: "14j", color: "green",
    priceHistory: [15,15,16,16,17,17,18,18,18,18.9,18.9,18.9],
    demandHistory: [60,62,64,65,67,69,70,71,72,72,72,72],
    keywords: ["bullet journal", "carnet pointillé", "journal créatif", "organisation"],
    demographics: { "18-24": 45, "25-34": 35, "35-44": 15, "45+": 5 },
    stores: { amazon: 75, shopify: 80, ebay: 62, woo: 70 },
    description: "Carnet A5 pointillé 200 pages, couverture rigide, papier 120g"
  },
  {
    id: 6, name: "Brosse Lisser Ionique", category: "Beauté", image: null,
    avgPrice: 59.90, margin: 58, demand: 85, score: 86, badge: "bestseller",
    competition: "Moyenne", seasonality: "Annuel", trend: "+14%",
    sellers: 94, stock: 60, stockReco: 110, restock: "4j", color: "orange",
    priceHistory: [48,50,52,54,56,57,58,59,59.9,59.9,59.9,59.9],
    demandHistory: [68,70,73,76,79,81,83,84,85,85,85,85],
    keywords: ["brosse lissante", "ionique", "cheveux lisses", "styling brush"],
    demographics: { "18-24": 32, "25-34": 40, "35-44": 20, "45+": 8 },
    stores: { amazon: 87, shopify: 83, ebay: 58, woo: 65 },
    description: "Brosse lissante ionique 230°C, cheveux brillants en 5 min, sans accroc"
  },
  {
    id: 7, name: "Support Voiture Magnétique", category: "Tech", image: null,
    avgPrice: 19.99, margin: 75, demand: 79, score: 82, badge: "opportunity",
    competition: "Élevée", seasonality: "Annuel", trend: "+9%",
    sellers: 445, stock: 180, stockReco: 150, restock: "10j", color: "green",
    priceHistory: [14,15,16,17,18,18,19,19,19.99,19.99,19.99,19.99],
    demandHistory: [62,65,68,70,72,74,76,77,78,79,79,79],
    keywords: ["support voiture", "magnétique", "phone holder", "GPS mount"],
    demographics: { "18-24": 25, "25-34": 48, "35-44": 22, "45+": 5 },
    stores: { amazon: 85, shopify: 70, ebay: 78, woo: 60 },
    description: "Support téléphone magnétique universel, grille d'aération, 360°"
  },
  {
    id: 8, name: "Bougie Parfumée Soja", category: "Maison", image: null,
    avgPrice: 22.00, margin: 82, demand: 83, score: 84, badge: "trending",
    competition: "Moyenne", seasonality: "Hiver", trend: "+20%",
    sellers: 210, stock: 95, stockReco: 180, restock: "3j", color: "orange",
    priceHistory: [17,18,18,19,20,20,21,21,22,22,22,22],
    demandHistory: [58,62,66,70,74,76,79,81,82,83,83,83],
    keywords: ["bougie soja", "parfumée", "naturelle", "cadeau"],
    demographics: { "18-24": 30, "25-34": 38, "35-44": 22, "45+": 10 },
    stores: { amazon: 82, shopify: 88, ebay: 52, woo: 75 },
    description: "Bougie en cire de soja 200g, parfum délicat, 45h de combustion"
  },
  {
    id: 9, name: "Gourde Isotherme 1L", category: "Sport", image: null,
    avgPrice: 35.00, margin: 60, demand: 87, score: 88, badge: "bestseller",
    competition: "Élevée", seasonality: "Été", trend: "+16%",
    sellers: 278, stock: 75, stockReco: 200, restock: "5j", color: "red",
    priceHistory: [28,29,30,31,32,33,34,34,35,35,35,35],
    demandHistory: [65,68,71,74,78,81,84,85,86,87,87,87],
    keywords: ["gourde isotherme", "inox", "sport", "hydroflask"],
    demographics: { "18-24": 35, "25-34": 40, "35-44": 18, "45+": 7 },
    stores: { amazon: 90, shopify: 86, ebay: 68, woo: 72 },
    description: "Gourde 1L double paroi inox, garde froid 24h/chaud 12h, sans BPA"
  },
  {
    id: 10, name: "Puzzle 1000 pièces Art", category: "Loisirs", image: null,
    avgPrice: 24.99, margin: 65, demand: 70, score: 75, badge: "opportunity",
    competition: "Faible", seasonality: "Hiver", trend: "+7%",
    sellers: 42, stock: 200, stockReco: 120, restock: "8j", color: "green",
    priceHistory: [19,20,21,21,22,23,23,24,24,24.99,24.99,24.99],
    demandHistory: [55,57,60,62,65,67,68,69,70,70,70,70],
    keywords: ["puzzle adulte", "1000 pièces", "art contemporain", "décoration"],
    demographics: { "18-24": 20, "25-34": 32, "35-44": 30, "45+": 18 },
    stores: { amazon: 74, shopify: 72, ebay: 70, woo: 65 },
    description: "Puzzle 1000 pièces reproductions d'art, boite premium, 50x70cm"
  },
  {
    id: 11, name: "Tapis Yoga Antidérapant", category: "Sport", image: null,
    avgPrice: 42.00, margin: 63, demand: 89, score: 87, badge: "trending",
    competition: "Moyenne", seasonality: "Annuel", trend: "+19%",
    sellers: 156, stock: 55, stockReco: 160, restock: "4j", color: "red",
    priceHistory: [34,35,36,37,38,39,40,40,41,42,42,42],
    demandHistory: [68,71,74,77,80,83,85,87,88,89,89,89],
    keywords: ["tapis yoga", "antidérapant", "TPE", "fitness mat"],
    demographics: { "18-24": 40, "25-34": 38, "35-44": 16, "45+": 6 },
    stores: { amazon: 89, shopify: 90, ebay: 62, woo: 76 },
    description: "Tapis yoga TPE 6mm, antidérapant double face, sangle incluse"
  },
  {
    id: 12, name: "Kit Soins Barbe Premium", category: "Beauté", image: null,
    avgPrice: 49.90, margin: 70, demand: 81, score: 83, badge: "bestseller",
    competition: "Moyenne", seasonality: "Noël", trend: "+11%",
    sellers: 88, stock: 110, stockReco: 140, restock: "6j", color: "green",
    priceHistory: [40,42,44,45,46,47,48,49,49.9,49.9,49.9,49.9],
    demandHistory: [63,66,69,71,74,76,78,79,80,81,81,81],
    keywords: ["kit barbe", "huile barbe", "soin homme", "grooming"],
    demographics: { "18-24": 28, "25-34": 45, "35-44": 22, "45+": 5 },
    stores: { amazon: 85, shopify: 82, ebay: 60, woo: 70 },
    description: "Kit complet barbe : huile, baume, peigne bois, ciseau, pochette"
  },
  {
    id: 13, name: "Montre Connectée Fitness", category: "Tech", image: null,
    avgPrice: 129.00, margin: 48, demand: 95, score: 93, badge: "trending",
    competition: "Élevée", seasonality: "Annuel", trend: "+25%",
    sellers: 321, stock: 30, stockReco: 150, restock: "2j", color: "red",
    priceHistory: [99,104,108,112,116,119,122,125,127,129,129,129],
    demandHistory: [72,76,79,82,86,89,91,93,94,95,95,95],
    keywords: ["smartwatch", "GPS", "santé", "Apple Watch alternative"],
    demographics: { "18-24": 32, "25-34": 42, "35-44": 20, "45+": 6 },
    stores: { amazon: 95, shopify: 88, ebay: 72, woo: 68 },
    description: "Montre GPS santé : SpO2, ECG, 100 sports, 10j autonomie, IP68"
  },
  {
    id: 14, name: "Organisateur Bureau Bois", category: "Maison", image: null,
    avgPrice: 38.00, margin: 69, demand: 74, score: 78, badge: "opportunity",
    competition: "Faible", seasonality: "Rentrée", trend: "+6%",
    sellers: 47, stock: 160, stockReco: 100, restock: "12j", color: "green",
    priceHistory: [30,31,32,33,34,35,36,37,38,38,38,38],
    demandHistory: [58,60,62,64,67,69,70,72,73,74,74,74],
    keywords: ["organisateur bureau", "bambou", "rangement", "desk organizer"],
    demographics: { "18-24": 22, "25-34": 46, "35-44": 25, "45+": 7 },
    stores: { amazon: 77, shopify: 84, ebay: 58, woo: 73 },
    description: "Organisateur de bureau en bambou, 5 compartiments, stylos et docs"
  },
  {
    id: 15, name: "Sérum Vitamine C 20%", category: "Beauté", image: null,
    avgPrice: 27.90, margin: 74, demand: 90, score: 91, badge: "bestseller",
    competition: "Moyenne", seasonality: "Annuel", trend: "+17%",
    sellers: 203, stock: 85, stockReco: 200, restock: "3j", color: "red",
    priceHistory: [22,23,24,24,25,26,27,27,27.9,27.9,27.9,27.9],
    demandHistory: [70,73,76,79,82,85,87,88,89,90,90,90],
    keywords: ["sérum vitamine C", "anti-taches", "éclat", "anti-âge"],
    demographics: { "18-24": 25, "25-34": 42, "35-44": 24, "45+": 9 },
    stores: { amazon: 92, shopify: 89, ebay: 52, woo: 78 },
    description: "Sérum vitamine C 20% + acide hyaluronique, anti-taches, flacon 30ml"
  },
  {
    id: 16, name: "Sac à Dos Hydratation", category: "Sport", image: null,
    avgPrice: 55.00, margin: 56, demand: 73, score: 76, badge: "opportunity",
    competition: "Faible", seasonality: "Été", trend: "+10%",
    sellers: 61, stock: 90, stockReco: 80, restock: "9j", color: "green",
    priceHistory: [45,46,48,49,50,51,52,53,54,55,55,55],
    demandHistory: [55,58,62,65,67,69,71,72,73,73,73,73],
    keywords: ["sac hydratation", "running trail", "2L poche eau", "cycling backpack"],
    demographics: { "18-24": 30, "25-34": 45, "35-44": 20, "45+": 5 },
    stores: { amazon: 76, shopify: 80, ebay: 58, woo: 65 },
    description: "Sac à dos trail 10L avec poche hydratation 2L, réfléchissant"
  },
  {
    id: 17, name: "Diffuseur Huiles Essentielles", category: "Maison", image: null,
    avgPrice: 32.00, margin: 67, demand: 82, score: 85, badge: "bestseller",
    competition: "Moyenne", seasonality: "Annuel", trend: "+13%",
    sellers: 175, stock: 100, stockReco: 130, restock: "5j", color: "orange",
    priceHistory: [26,27,28,29,30,30,31,31,32,32,32,32],
    demandHistory: [66,68,71,73,76,78,80,81,82,82,82,82],
    keywords: ["diffuseur aromathérapie", "huiles essentielles", "humidificateur", "zen"],
    demographics: { "18-24": 26, "25-34": 38, "35-44": 26, "45+": 10 },
    stores: { amazon: 84, shopify: 87, ebay: 55, woo: 74 },
    description: "Diffuseur ultrasonique 300ml, 7 couleurs LED, minuterie, silencieux"
  },
  {
    id: 18, name: "Clavier Mécanique RGB", category: "Tech", image: null,
    avgPrice: 89.00, margin: 50, demand: 84, score: 85, badge: "trending",
    competition: "Élevée", seasonality: "Annuel", trend: "+15%",
    sellers: 248, stock: 40, stockReco: 120, restock: "3j", color: "red",
    priceHistory: [72,74,76,78,80,82,84,85,87,88,89,89],
    demandHistory: [68,71,74,76,79,81,83,84,84,84,84,84],
    keywords: ["clavier mécanique", "RGB", "gaming", "TKL keyboard"],
    demographics: { "18-24": 45, "25-34": 38, "35-44": 14, "45+": 3 },
    stores: { amazon: 86, shopify: 80, ebay: 75, woo: 62 },
    description: "Clavier mécanique TKL, switches Cherry MX Red, RGB per-key, aluminium"
  },
  {
    id: 19, name: "Pyjama Satiné Soie", category: "Mode", image: null,
    avgPrice: 48.00, margin: 66, demand: 78, score: 80, badge: "opportunity",
    competition: "Faible", seasonality: "Noël", trend: "+8%",
    sellers: 52, stock: 130, stockReco: 100, restock: "7j", color: "green",
    priceHistory: [39,40,42,43,44,45,46,47,48,48,48,48],
    demandHistory: [60,63,66,68,71,73,75,76,77,78,78,78],
    keywords: ["pyjama satin", "soie", "cadeau femme", "loungewear"],
    demographics: { "18-24": 28, "25-34": 42, "35-44": 22, "45+": 8 },
    stores: { amazon: 79, shopify: 88, ebay: 50, woo: 72 },
    description: "Pyjama 2 pièces satiné toucher soie, tailles XS-XL, 8 coloris"
  },
  {
    id: 20, name: "Casque Réalité Virtuelle", category: "Tech", image: null,
    avgPrice: 249.00, margin: 35, demand: 68, score: 74, badge: "opportunity",
    competition: "Faible", seasonality: "Noël", trend: "+30%",
    sellers: 28, stock: 15, stockReco: 50, restock: "5j", color: "red",
    priceHistory: [199,209,219,224,229,234,239,242,245,249,249,249],
    demandHistory: [38,42,46,49,52,55,58,61,64,67,68,68],
    keywords: ["casque VR", "réalité virtuelle", "metaverse", "VR headset"],
    demographics: { "18-24": 42, "25-34": 38, "35-44": 16, "45+": 4 },
    stores: { amazon: 72, shopify: 70, ebay: 60, woo: 50 },
    description: "Casque VR autonome 128GB, résolution 4K, 6DoF, bibliothèque 500+ apps"
  }
];

window.MOCK_KPI = {
  revenue: { value: "€2.4M", change: "+12.3%", positive: true },
  outOfStock: { value: "7", change: "+2", positive: false },
  topPerformers: { value: "23", change: "+5", positive: true },
  alerts: { value: "12", change: "-3", positive: true }
};

window.MOCK_REVENUE_CHART = [
  { month: "Juin", revenue: 165000, orders: 1820 },
  { month: "Juil", revenue: 178000, orders: 1950 },
  { month: "Août", revenue: 172000, orders: 1880 },
  { month: "Sep", revenue: 195000, orders: 2140 },
  { month: "Oct", revenue: 210000, orders: 2310 },
  { month: "Nov", revenue: 245000, orders: 2690 },
  { month: "Déc", revenue: 312000, orders: 3420 },
  { month: "Jan", revenue: 198000, orders: 2180 },
  { month: "Fév", revenue: 187000, orders: 2050 },
  { month: "Mar", revenue: 215000, orders: 2360 },
  { month: "Avr", revenue: 228000, orders: 2510 },
  { month: "Mai", revenue: 241000, orders: 2650 }
];

window.MOCK_CATEGORY_DATA = [
  { name: "Tech", value: 38 },
  { name: "Beauté", value: 24 },
  { name: "Sport", value: 18 },
  { name: "Maison", value: 12 },
  { name: "Mode", value: 8 }
];

window.MOCK_STORES_DATA = [
  { store: "Amazon", products: 847, avgRating: 4.3, revenue: "€890K", growth: "+15%", topCategory: "Tech" },
  { store: "Shopify", products: 312, avgRating: 4.6, revenue: "€640K", growth: "+28%", topCategory: "Beauté" },
  { store: "eBay", products: 1240, avgRating: 4.0, revenue: "€420K", growth: "+6%", topCategory: "Mode" },
  { store: "WooCommerce", products: 198, avgRating: 4.4, revenue: "€280K", growth: "+19%", topCategory: "Maison" },
  { store: "Etsy", products: 89, avgRating: 4.8, revenue: "€120K", growth: "+42%", topCategory: "Artisanat" }
];

window.MOCK_REPORTS = [
  { id: 1, name: "Rapport Hebdomadaire", type: "hebdo", lastRun: "Lun 28 Avr", format: "PDF", size: "2.4 MB" },
  { id: 2, name: "Performance Top 10", type: "custom", lastRun: "Ven 25 Avr", format: "Excel", size: "1.1 MB" },
  { id: 3, name: "Analyse Stocks Critiques", type: "custom", lastRun: "Mer 23 Avr", format: "PDF", size: "880 KB" },
  { id: 4, name: "Rapport Mensuel Avril", type: "mensuel", lastRun: "1 Mai", format: "PDF", size: "5.2 MB" }
];
