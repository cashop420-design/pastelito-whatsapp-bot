// index.js
// Bot de WhatsApp de Pastelito High 💚

// -------------------- dependencias --------------------
const express = require("express");
const axios = require("axios");

// -------------------- config (variables de entorno) --------------------
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// 🔎 DEBUG SOLO PARA PROBAR EL TOKEN (puedes borrarlo después)
console.log(
  "🚦 DEBUG WHATSAPP_TOKEN prefix:",
  (WHATSAPP_TOKEN || "").slice(0, 30)
);


// -------------------- URLs de imágenes --------------------
const MENU_IMAGE_URL = "https://i.imgur.com/RPp27bH.jpeg";          // Menú general
const BREB_IMAGE_URL = "https://i.imgur.com/cNiomJA.jpeg";          // Imagen pago por llave Bre-B / DaviPlata
const DOSES_GUIDE_IMAGE_URL = "https://i.imgur.com/oib3KDs.jpeg";   // Guía general de dosis en comestibles
const CONCENTRATION_TABLE_IMAGE_URL = "https://i.imgur.com/PYn18sE.jpeg"; 
// TODO: reemplaza XXXXX por el ID real de la tabla de concentraciones cuando tengas el URL público

// -------------------- app express --------------------
const app = express();
app.use(express.json());

// -------------------- TEXTOS BASE (COPYS) --------------------

// Bienvenida general
const WELCOME_TEXT =
  "🌈✨ Bienvenid@ al rincón más dulce del viaje, soy Pastelito High 🍪💨.\n" +
  "Aquí todo está listo pa’ endulzarte la vida y llevarte a otro nivel 🚀.\n\n" +
  "👉 *Qué puedo hacer por ti:*\n" +
  "• Mostrarte el menú completo y las promos activas 🧁🍬🍪\n" +
  "• Recomendarte combos según tu vuelo y presupuesto 😏\n" +
  "• Explicarte las opciones de pago y envío 💸🚚\n\n" +
  "Respóndeme con lo que buscas, por ejemplo:\n" +
  "» *\"Menú\"* · *\"Promos\"* · *\"Combos\"* · *\"Envíos\"* · *\"Pago\"* · *\"Contra entrega\"* · *\"Recoger\"*.";

// Caption del menú
const MENU_CAPTION_DEFAULT =
  "💚 Aquí te dejo el menú actualizado de nuestros antojitos con truco 🌈\n" +
  "Hay promos, combos y opciones para todos los niveles de vuelo 🚀\n\n" +
  "Dime qué se te antoja o cuánto presupuesto tienes y te armo algo bien sabroso 😏";

// Texto sobre opciones de envío
const ENVIOS_DETALLE =
  "🚚 *Opciones de envío Candy Shop 420*\n\n" +
  "1️⃣ *Moto en Bogotá (envío rápido)*\n" +
  "• Haces el pago anticipado por llave Bre-B.\n" +
  "• Verificamos el pago y pedimos motero por app.\n" +
  "• El domi llega hoy mismo (según la zona).\n" +
  "• El valor del envío se paga en efectivo al domiciliario al recibir.\n\n" +
  "2️⃣ *Interrapidísimo prepago (a todo el país)*\n" +
  "• Pagas primero el valor de los productos por llave.\n" +
  "• Enviamos por Interrapidísimo.\n" +
  "• El pedido puede tardar de *1 a 3 días hábiles* según tu ciudad.\n" +
  "• El envío lo pagas al recibir en la transportadora.\n\n" +
  "3️⃣ *Pago contra entrega con Interrapidísimo*\n" +
  "• Pedido mínimo: *45.000 COP*.\n" +
  "• Se cobra un *5% adicional* sobre el valor del pedido.\n" +
  "• Además pagas el valor del envío (varía según ciudad).\n" +
  "• Pagas todo cuando recibes el paquete.\n\n" +
  "Si me mandas tu dirección (barrio/ciudad) te cotizo costo de envío y tiempo estimado de llegada 😉";

// Contraentrega detalle
const CONTRA_ENTREGA_DETALLE =
  "📦 *Pago contra entrega con Interrapidísimo*\n\n" +
  "El pago contra entrega se maneja bajo las normas de Interrapidísimo:\n\n" +
  "• *Pedido mínimo:* 45.000 COP\n" +
  "• *Recargo:* 5% del valor del pedido\n" +
  "• *Más:* valor del envío (varía según ciudad)\n\n" +
  "Ejemplo: el 5% de 45k = 2.400.\n\n" +
  "Compárteme tu dirección de entrega y te digo costo de envío y tiempo estimado de llegada 🕒";

// Puntos de recogida en Bogotá
const PICKUP_BOGOTA =
  "📍 *Punto de recogida en Bogotá*\n\n" +
  "Si prefieres evitar envío, puedes recoger tu pedido *GRATIS* desde las *10am hasta las 10pm* en cualquiera de estos dos puntos:\n\n" +
  "🚉 Estación de TransMilenio *Banderas*\n" +
  "🏬 *Plaza de las Américas* – entrada principal\n\n" +
  "Solo dime:\n" +
  "1️⃣ Qué producto quieres\n" +
  "2️⃣ Hora aproximada en la que pasas\n" +
  "y te lo dejamos listo 🍬💚";

// Pago por llave
const PAGO_LLAVE =
  "💸 *Págame fácil desde cualquier banco*\n\n" +
  "Solo envía el valor del pedido a esta llave DaviPlata / Bre-B 👇\n\n" +
  "@PLATA3027102711\n\n" +
  "Funciona con cualquier entidad bancaria — no necesitas número de cuenta.\n\n" +
  "✨ Cuando hagas el pago, mándame pantallazo y seguimos con el envío.\n" +
  "Recuerda: el valor del domi lo cancelas en casa al recibir 🚚";

// Pago corto cuando ya están listos
const PAGO_LISTONES =
  "Listones, te dejo la llave de Bre-B para que puedas ir haciendo el pago 🧾:\n\n" +
  "@PLATA3027102711\n\n" +
  "Recuerda: solo el valor del producto, el valor del domi lo cancelas en casa al recibir 🙌";

// Agradecimiento post-compra + playlist
const THANK_YOU_SPOTIFY =
  "¡Feliz día, parcer@ del dulce! 🍬🚀\n" +
  "Gracias por confiar en nosotros para tu antojo mágico. Que hoy tengas un viaje delicioso, tranquilo y lleno de buena vibra.\n" +
  "Te dejamos nuestra playlist oficial *Highway to Candyland* pa’ que el mood te acompañe todo el camino 🎶💗\n\n" +
  "👉 Spotify: https://open.spotify.com/playlist/61XEHM0PWGL3rjeuwrPuVQ?si=uYvaDGZuRFa2a8eD5-JwSA\n" +
  "👉 Instagram: @pastelitohigh\n" +
  "👉 WhatsApp: ‪+57 301 8050122‬\n\n" +
  "Si necesitas más delicias o repetir el viaje… tú ya sabes dónde estamos 💚";

// Pasaporte del Viaje
const PASAPORTE_COPY =
  "🌟 Bienvenid@ a tu *Pasaporte del Viaje* 🌟\n\n" +
  "Prepárate para despegar, viajer@ dulce…\n" +
  "Con este pasaporte, cada compra es una parada en tu recorrido por el universo más sabroso y mágico.\n\n" +
  "🚀 *Cómo funciona:*\n" +
  "1. Recibes tu pasaporte en tu primer pedido (con el primer sticker ya pegado).\n" +
  "2. Acumulas un sticker por cada compra que hagas.\n" +
  "3. Llenas todos los espacios (6 u 8 según tu edición) y…\n" +
  "4. Canjeas tu pasaporte completo por un regalo sideral o descuento exclusivo.\n\n" +
  "💡 *Cosas que debes saber:*\n" +
  "• Este pasaporte es solo tuyo, no lo prestes ni lo intercambies.\n" +
  "• Los stickers se entregan únicamente junto con cada pedido.\n" +
  "• Sin pasaporte físico, no hay premio.\n" +
  "• Promoción válida hasta agotar existencias de premios.\n\n" +
  "📍 Punto de control de la nave:\n" +
  "📱 WhatsApp: ‪+57 301 771 0435‬\n" +
  "📸 Instagram: @pastelitohigh";

// Follow IG
const FOLLOW_IG_COPY =
  "Ey, si quieres montarte al viaje completo, síguenos en Instagram 👉 @pastelitohigh.\n" +
  "Allá soltamos actividades, juegos, sorpresas del *Pasaporte del Viaje* y anuncios que no salen por WhatsApp.\n" +
  "Si te gusta cazar promos, lanzamientos y regalitos… allá es donde pasa la magia ✨🍬🚀";

// Mensaje por defecto
const DEFAULT_HELP_TEXT =
  "✨ Te leo, pero necesito entenderte mejor.\n\n" +
  "Puedes decirme por ejemplo:\n" +
  "• *\"Menú\"* para ver productos\n" +
  "• *\"Promos\"* o *\"Combos\"* para ver ofertas\n" +
  "• *\"Envíos\"* o *\"Domi\"* para saber cómo te llega el pedido\n" +
  "• *\"Pago\"* o *\"Llave\"* para detalles de pago\n" +
  "• Nombre de un producto (brownie, galleta, gomitas, helado, nutella, bombón, etc.) para ver precio y concentración\n\n" +
  "Y si ya tienes algo en mente, cuéntame qué producto y cuántas unidades se te antojan 😋";

// -------------------- INFO POR PRODUCTO --------------------

const PRODUCT_INFO = [
  {
    key: "frozen_trip",
    aliases: ["frozen trip", "frozen", "helado"],
    text:
      "🧊 *Frozen Trip*\n\n" +
      "Helado de vainilla de 12oz con pedacitos de brownie y sprinkles mágicos.\n" +
      "Trae *600mg de concentración*.\n" +
      "💰 Precio: *$30.900*.\n\n" +
      "Suave, frío y con truco: ideal pa’ un viaje dulce, refrescante y directo a la nube 7 🚀✨",
  },
  {
    key: "capitan_candyfly",
    aliases: ["capitan candyfly", "capitán candyfly", "nutella", "crema untable", "avellanas"],
    text:
      "🚀 *Capitán CandyFly*\n\n" +
      "Nuestra crema untable de avellanas de 12oz, sedosa, chocolatosita y con truco.\n" +
      "Trae *600mg de concentración*.\n" +
      "💰 Precio: *$34.900*.\n\n" +
      "Perfecta para untar, dipear o simplemente cerrar los ojos y despegar ✈️🌌",
  },
  {
    key: "brownie_truco",
    aliases: ["brownie", "brownie con truco", "brownies"],
    text:
      "🍫 *Brownie con Truco grande*\n\n" +
      "Cada brownie trae entre *140 y 150mg* de concentración.\n" +
      "💰 Precio: *$18.000*.\n\n" +
      "Textura densa, sabor brutal y efecto chill que te abraza 💫",
  },
  {
    key: "galleta_grande",
    aliases: ["galleta grande", "galleta con altura grande", "cookie grande", "galleta 140"],
    text:
      "🍪 *Galleta con Altura Grande*\n\n" +
      "Cada galleta grande trae entre *140 y 150mg* de concentración.\n" +
      "💰 Precio: *$15.000*.\n\n" +
      "Crujientica, dulce y con el empujón sideral perfecto 🚀",
  },
  {
    key: "galleta_mediana",
    aliases: ["galleta mediana", "galleta 70", "cookie mediana"],
    text:
      "🍪 *Galleta Mediana*\n\n" +
      "Cada galleta mediana trae *70mg* de concentración.\n" +
      "💰 Precio: *$8.000*.\n\n" +
      "Para un viajecito suave pero bien presente 🌈",
  },
  {
    key: "gomitas_mini_tripi",
    aliases: ["mini tripipack", "mini tripi", "microdosis", "gomitas pequeñas"],
    text:
      "🍬 *Gomitas del Viaje – Mini TripiPack*\n\n" +
      "🌀 Paquete con *10 microdosis* (10–15mg c/u).\n" +
      "💰 Precio: *$10.000*.\n\n" +
      "Fluye suavecito, perfecto pa’ quienes quieren probar sin irse lejos.",
  },
  {
    key: "gomitas_combo_flow",
    aliases: ["combo flow", "gomitas flow"],
    text:
      "🍬 *Gomitas del Viaje – Combo Flow*\n\n" +
      "🌤️ Paquete con *6 gomitas surtidas* (15–20mg c/u).\n" +
      "💰 Precio: *$15.000*.\n\n" +
      "Efecto medio, ideal para una tarde con flow.",
  },
  {
    key: "gomitas_frutal_high",
    aliases: ["frutal high", "gomitas frutales", "gomitas grandes"],
    text:
      "🍬 *Gomitas del Viaje – Frutal High*\n\n" +
      "🌈 Paquete con *3 gomitas grandes* (70mg c/u).\n" +
      "💰 Precio: *$18.000*.\n\n" +
      "Dulce, potente y lista pa’ levantar vuelo.",
  },
  {
    key: "gomitas_munchie_pack",
    aliases: ["munchie pack", "munchies", "gomitas munchie"],
    text:
      "🍬 *Gomitas del Viaje – Munchie Pack*\n\n" +
      "🍭 Paquete con *12 gomitas surtidas* (15–20mg c/u).\n" +
      "💰 Precio: *$25.000*.\n\n" +
      "Para lxs que quieren viaje larguito y munchies asegurados.",
  },
  {
    key: "gomitas_tripi_premium",
    aliases: ["tripiseta premium", "tripi premium", "premium gomitas"],
    text:
      "🍬 *Gomitas del Viaje – Tripiseta Premium*\n\n" +
      "🌌 Paquete con *4 gomitas* (70–80mg c/u).\n" +
      "💰 Precio: *$30.000*.\n\n" +
      "Set premium pa’ quienes ya conocen la órbita.",
  },
  {
    key: "cupstars",
    aliases: ["cupstars", "cup stars", "cupcake", "mini cupcakes"],
    text:
      "⭐ *CupStars* (mini cupcakes)\n\n" +
      "Vienen en paquete x2.\n" +
      "Cada mini cupcake trae *70mg* de concentración.\n" +
      "💰 Precio: *$15.000*.\n\n" +
      "Vainilla, suavecito y con magia escondida ✨🧁",
  },
  {
    key: "astrodonas",
    aliases: ["astrodonas", "astro donas", "donas", "donitas"],
    text:
      "🪐 *AstroDonas*\n\n" +
      "Vienen 2 por paquete.\n" +
      "Cada una trae *70mg* de concentración.\n" +
      "💰 Precio: *$15.000*.\n\n" +
      "Donitas de vainilla con baño de chocolate sideral 🍬🔥",
  },
  {
    key: "bombon_flow",
    aliases: ["bombon con flow", "bombón con flow", "bombones", "bombon"],
    text:
      "🔱 *Bombón con Flow* x2\n\n" +
      "Cada chocolate relleno de kiwi trae entre *80 y 90mg* de concentración.\n" +
      "💰 Precio: *$15.000*.\n\n" +
      "Un clásico de la casa: dulce, jugoso y con viaje elegante 🍫✨",
  },
];

// Helper para encontrar producto por texto
function findProductByText(text) {
  const t = text.toLowerCase();
  for (const p of PRODUCT_INFO) {
    if (p.aliases.some((alias) => t.includes(alias))) {
      return p;
    }
  }
  return null;
}

// -------------------- HELPER PARA ENVIAR MENSAJES --------------------
async function sendWhatsApp(payload) {
  try {
    const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

    await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
    });

    console.log("✅ Mensaje enviado a WhatsApp:", JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("❌ Error enviando mensaje a WhatsApp:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Helpers específicos
async function sendMenu(from) {
  const textMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: WELCOME_TEXT },
  };

  const imageMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "image",
    image: {
      link: MENU_IMAGE_URL,
      caption: MENU_CAPTION_DEFAULT,
    },
  };

  await sendWhatsApp(textMessage);
  await sendWhatsApp(imageMessage);
}

async function sendPaymentInfo(from) {
  const textMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: PAGO_LLAVE },
  };

  const imageMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "image",
    image: {
      link: BREB_IMAGE_URL,
      caption: "💸 Llave activa Bre-B / DaviPlata @PLATA3027102711 · Rápido · Seguro",
    },
  };

  await sendWhatsApp(textMessage);
  await sendWhatsApp(imageMessage);
}

async function sendDoseGuide(from) {
  const guideImage = {
    messaging_product: "whatsapp",
    to: from,
    type: "image",
    image: {
      link: DOSES_GUIDE_IMAGE_URL,
      caption:
        "📊 Guía general de dosis en comestibles.\n" +
        "Recuerda que la experiencia puede variar según tu tolerancia, estómago y contexto. Ve de menos a más 😉",
    },
  };

  await sendWhatsApp(guideImage);

  if (CONCENTRATION_TABLE_IMAGE_URL && !CONCENTRATION_TABLE_IMAGE_URL.includes("XXXXX")) {
    const tableImage = {
      messaging_product: "whatsapp",
      to: from,
      type: "image",
      image: {
        link: CONCENTRATION_TABLE_IMAGE_URL,
        caption: "📐 Tabla de concentraciones de los productos de Candy Shop 420.",
      },
    };
    await sendWhatsApp(tableImage);
  }
}

// -------------------- DETECCIÓN DE INTENT --------------------
function detectIntent(text) {
  const t = text.toLowerCase().trim();

  if (!t) return { type: "UNKNOWN" };

  // Post-compra (agradecimientos / ya llegó)
  if (
    t.includes("ya llego") ||
    t.includes("ya llegó") ||
    t.includes("me llego") ||
    t.includes("me llegó") ||
    t.includes("ya recibi") ||
    t.includes("ya recibí") ||
    (t.includes("muchas gracias ya me llego") && (t.includes("llego bien") || t.includes("llego") || t.includes("llegó")))
  ) {
    return { type: "POST_COMPRA" };
  }

  // Saludos
  if (
    t === "hola" ||
    t.startsWith("buenas") ||
    t.includes("holi") ||
    t.includes("que hubo") ||
    t.includes("q hubo") ||
    t.includes("buen dia") ||
    t.includes("buen día")
  ) {
    return { type: "GREETING" };
  }

  // Menú / promos / combos
  if (
    t.includes("menu") ||
    t.includes("menú") ||
    t.includes("carta") ||
    t.includes("promo") ||
    t.includes("promos") ||
    t.includes("combo") ||
    t.includes("combos")
  ) {
    return { type: "MENU" };
  }

  // Envíos en general
  if (
    t.includes("envio") ||
    t.includes("envío") ||
    t.includes("domicilio") ||
    t.includes("domi") ||
    t.includes("interrapidisimo") ||
    t.includes("interrapidísimo") ||
    t.includes("enviar") ||
    t.includes("cuando llega")
  ) {
    // Contraentrega específica
    if (t.includes("contra entrega") || t.includes("contraentrega")) {
      return { type: "CONTRA_ENTREGA" };
    }
    return { type: "ENVIOS" };
  }

  // Contraentrega explícito
  if (t.includes("contra entrega") || t.includes("contraentrega")) {
    return { type: "CONTRA_ENTREGA" };
  }

  // Pago / llave / métodos de pago
  if (
    t.includes("pago") ||
    t.includes("pagar") ||
    t.includes("llave") ||
    t.includes("bre-b") ||
    t.includes("breb") ||
    t.includes("daviplata") ||
    t.includes("nequi")
  ) {
    return { type: "PAGO" };
  }

  // Recoger en punto físico
  if (
    t.includes("recoger") ||
    t.includes("retiro") ||
    t.includes("punto fisico") ||
    t.includes("punto físico") ||
    t.includes("banderas") ||
    t.includes("plaza de las americas") ||
    t.includes("plaza de las américas")
  ) {
    return { type: "PICKUP" };
  }

  // IG / redes
  if (
    t.includes("instagram") ||
    t.includes("ig") ||
    t.includes("redes") ||
    t.includes("como los encuentro") ||
    t.includes("cómo los encuentro")
  ) {
    return { type: "FOLLOW_IG" };
  }

  // Concentración / dosis
  if (
    t.includes("concentracion") ||
    t.includes("concentración") ||
    t.includes("mg") ||
    t.includes("miligramos") ||
    t.includes("dosis")
  ) {
    return { type: "CONCENTRACION" };
  }

  // Producto específico
  const product = findProductByText(t);
  if (product) {
    return { type: "PRODUCTO", product };
  }

  return { type: "UNKNOWN" };
}

// -------------------- HANDLERS POR INTENT --------------------
async function handleGreeting(from) {
  await sendMenu(from);
}

async function handleMenu(from) {
  await sendMenu(from);
}

async function handleEnvios(from) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: ENVIOS_DETALLE },
  };
  await sendWhatsApp(msg);
}

async function handleContraEntrega(from) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: CONTRA_ENTREGA_DETALLE },
  };
  await sendWhatsApp(msg);
}

async function handlePago(from) {
  await sendPaymentInfo(from);
}

async function handlePickup(from) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: PICKUP_BOGOTA },
  };
  await sendWhatsApp(msg);
}

async function handleProducto(from, product) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: product.text },
  };
  await sendWhatsApp(msg);
}

async function handleConcentracion(from, text) {
  // Si viene con nombre de producto, respondemos producto + guía
  const product = findProductByText(text);
  if (product) {
    await handleProducto(from, product);
  }
  await sendDoseGuide(from);
}

async function handlePostCompra(from) {
  const thanksMsg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: THANK_YOU_SPOTIFY },
  };
  const passportMsg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: PASAPORTE_COPY },
  };

  await sendWhatsApp(thanksMsg);
  await sendWhatsApp(passportMsg);
}

async function handleFollowIG(from) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: FOLLOW_IG_COPY },
  };
  await sendWhatsApp(msg);
}

async function handleUnknown(from) {
  const msg = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: { body: DEFAULT_HELP_TEXT },
  };
  await sendWhatsApp(msg);
}

// -------------------- LÓGICA PRINCIPAL --------------------
async function handleIncomingMessage(message, from) {
  const textRaw =
    message.text?.body ||
    message.interactive?.text?.body ||
    "";
  const text = textRaw.toLowerCase().trim();

  console.log("📩 Mensaje recibido de", from, "=>", textRaw);

  const intent = detectIntent(text);
  console.log("🎯 Intent detectado:", intent.type, intent.product?.key || "");

  switch (intent.type) {
    case "GREETING":
      return await handleGreeting(from);
    case "MENU":
      return await handleMenu(from);
    case "ENVIOS":
      return await handleEnvios(from);
    case "CONTRA_ENTREGA":
      return await handleContraEntrega(from);
    case "PAGO":
      return await handlePago(from);
    case "PICKUP":
      return await handlePickup(from);
    case "PRODUCTO":
      return await handleProducto(from, intent.product);
    case "CONCENTRACION":
      return await handleConcentracion(from, text);
    case "POST_COMPRA":
      return await handlePostCompra(from);
    case "FOLLOW_IG":
      return await handleFollowIG(from);
    default:
      return await handleUnknown(from);
  }
}

// -------------------- ENDPOINTS WEBHOOK --------------------

// Verificación inicial del webhook (Meta llama con GET)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Falló la verificación del webhook");
  return res.sendStatus(403);
});

// Recepción de mensajes (Meta llama con POST)
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return res.sendStatus(200);
    }

    const message = messages[0];
    const from = message.from;

    if (message.type === "text" || message.type === "interactive") {
      await handleIncomingMessage(message, from);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    res.sendStatus(500);
  }
});

// Endpoint simple para probar que el servidor está vivo
app.get("/", (req, res) => {
  res.send("Pastelito High WhatsApp bot está vivo 💚");
});

// -------------------- inicio del servidor --------------------
app.listen(PORT, () => {
  console.log(`🚀 Pastelito bot escuchando en el puerto ${PORT}`);
});
