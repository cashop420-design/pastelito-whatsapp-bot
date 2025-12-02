// index.js
// Bot de WhatsApp de Pastelito High 💚

// -------------------- dependencias --------------------
const express = require("express");
const axios = require("axios");

// -------------------- config (variables de entorno) --------------------
// ESTO NO LO CAMBIAS AQUÍ. Se llena en Render como variables de entorno.
const PORT = process.env.PORT || 3000;

// Token de verificación para el webhook (tú inventas una palabra, ej: pastelito_verify)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Token de acceso de la API de WhatsApp (el que te dio Meta)
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// ID del número de WhatsApp (el "Identificador de número de teléfono" que viste en Meta)
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// URL de la imagen del menú
const MENU_IMAGE_URL = "https://i.imgur.com/RPp27bH.jpeg";

// -------------------- app express --------------------
const app = express();
app.use(express.json());

// -------------------- textos base para el bot --------------------

// Texto de bienvenida general
const WELCOME_TEXT =
  "🌈✨ Bienvenid@ al rincón más dulce del viaje, soy Pastelito High 🍪💨.\n" +
  "Aquí todo está listo pa’ endulzarte la vida y llevarte a otro nivel 🚀.\n\n" +
  "👉 *Qué puedo hacer por ti:*\n" +
  "• Mostrarte el menú completo y las promos activas 🧁🍬🍪\n" +
  "• Recomendarte combos según tu vuelo y presupuesto 😏\n" +
  "• Explicarte las opciones de pago y envío 💸🚚\n\n" +
  "Respóndeme con lo que buscas, por ejemplo:\n" +
  "» *\"Menú\"* · *\"Promos\"* · *\"Combos\"* · *\"Envíos\"* · *\"Pago\"* · *\"Contra entrega\"*.";

// Texto sobre opciones de envío (3 formas)
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

// Detalle específico de contra entrega (versión larga)
const CONTRA_ENTREGA_DETALLE =
  "📦 *Pago contra entrega con Interrapidísimo*\n\n" +
  "El pago contra entrega se maneja bajo las normas de Interrapidísimo:\n\n" +
  "• *Pedido mínimo:* 45.000 COP\n" +
  "• *Recargo:* 5% del valor del pedido\n" +
  "• *Más:* valor del envío (varía según ciudad)\n\n" +
  "Ejemplo: el 5% de 45k = 2.400.\n\n" +
  "Compárteme tu dirección de entrega y te digo costo de envío y tiempo estimado de llegada 🕒";

// Versión Bogotá específica (por si la quieres usar luego)
const CONTRA_ENTREGA_BOGOTA =
  "📦 *Pago contra entrega Bogotá (Interrapidísimo)*\n\n" +
  "Pedido mínimo de *45k* + el *5%* del valor del pedido + valor del envío.\n" +
  "Ej: el 5% de 45k = 2.400.\n\n" +
  "En Bogotá el envío suele estar alrededor de 10k y llegaría mañana (dependiendo de la hora en que hagamos el envío).\n\n" +
  "También puedes *recoger sin costo de envío* en:\n" +
  "• Estación Banderas 🚉\n" +
  "• Plaza de las Américas, entrada principal 🏬 (hasta las 10 pm)";

// Texto de pago por llave Bre-B / DaviPlata
const PAGO_LLAVE =
  "💸 *Págame fácil desde cualquier banco*\n\n" +
  "Solo envía el valor del pedido a esta llave DaviPlata / Bre-B 👇\n\n" +
  "@PLATA3027102711\n\n" +
  "Funciona con cualquier entidad bancaria, no necesitas número de cuenta.\n\n" +
  "✨ Cuando hagas el pago, mándame pantallazo y seguimos con el envío.\n" +
  "Recuerda: el valor del domi lo cancelas en casa al recibir 🚚";

// Texto corto cuando ya están listos para pagar
const PAGO_LISTONES =
  "Listones, te dejo la llave de Bre-B para que puedas ir haciendo el pago 🧾:\n\n" +
  "@PLATA3027102711\n\n" +
  "Recuerda: solo el valor del producto, el valor del domi lo cancelas en casa al recibir 🙌";

// -------------------- helper para enviar mensajes --------------------
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

// -------------------- lógica de respuesta --------------------
async function handleIncomingMessage(message, from) {
  const textRaw =
    message.text?.body ||
    message.interactive?.text?.body ||
    "";
  const text = textRaw.toLowerCase().trim();

  console.log("📩 Mensaje recibido de", from, "=>", textRaw);

  // 1) Info de envíos
  if (
    text.includes("envio") ||
    text.includes("envío") ||
    text.includes("domicilio") ||
    text.includes("domi") ||
    text.includes("interrapidisimo") ||
    text.includes("interrapidísimo")
  ) {
    const msg = {
      messaging_product: "whatsapp",
      to: from,
      type: "text",
      text: { body: ENVIOS_DETALLE },
    };
    await sendWhatsApp(msg);
    return;
  }

  // 2) Contra entrega explícito
  if (text.includes("contra entrega") || text.includes("contraentrega")) {
    const msg = {
      messaging_product: "whatsapp",
      to: from,
      type: "text",
      text: { body: CONTRA_ENTREGA_DETALLE },
    };
    await sendWhatsApp(msg);
    return;
  }

  // 3) Pago / llave / métodos de pago
  if (
    text.includes("pago") ||
    text.includes("pagar") ||
    text.includes("llave") ||
    text.includes("bre-b") ||
    text.includes("breb") ||
    text.includes("daviplata") ||
    text.includes("nequi")
  ) {
    const msg = {
      messaging_product: "whatsapp",
      to: from,
      type: "text",
      text: { body: PAGO_LLAVE },
    };
    await sendWhatsApp(msg);
    return;
  }

  // 4) Menú / promos / combos
  if (
    text.includes("menu") ||
    text.includes("menú") ||
    text.includes("carta") ||
    text.includes("promo") ||
    text.includes("promos") ||
    text.includes("combo") ||
    text.includes("combos")
  ) {
    // primero saludo / explicación
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
        caption:
          "💚 Aquí te dejo el menú actualizado de nuestros antojitos con truco 🌈\n" +
          "Hay promos, combos y opciones para todos los niveles de vuelo 🚀\n\n" +
          "Dime qué se te antoja o cuánto presupuesto tienes y te armo algo bien sabroso 😏",
      },
    };

    await sendWhatsApp(textMessage); // saludo primero
    await sendWhatsApp(imageMessage); // menú después
    return;
  }

  // 5) Saludos básicos (primer contacto)
  if (
    text === "hola" ||
    text.startsWith("buenas") ||
    text.includes("que hubo") ||
    text.includes("q hubo") ||
    text.includes("holi")
  ) {
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
        caption:
          "🧁 Este es el menú base del viaje.\n" +
          "Además suelo tener promos y combos activos, así que si quieres dime *\"promos\"* o cuéntame tu presupuesto y te ayudo a elegir 🤝",
      },
    };

    await sendWhatsApp(textMessage); // saludo primero
    await sendWhatsApp(imageMessage);
    return;
  }

  // 6) Default: cualquier otra cosa
  const defaultMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: {
      body:
        "✨ Te leo, pero necesito entenderte mejor.\n\n" +
        "Puedes decirme por ejemplo:\n" +
        "• *\"Menú\"* para ver productos\n" +
        "• *\"Promos\"* o *\"Combos\"* para ver ofertas\n" +
        "• *\"Envíos\"* para saber cómo te llega el pedido\n" +
        "• *\"Pago\"* o *\"Llave\"* para detalles de pago\n\n" +
        "Y si ya tienes algo en mente, cuéntame qué producto y cuántas unidades se te antojan 😋",
    },
  };

  await sendWhatsApp(defaultMessage);
}

// -------------------- endpoints del webhook --------------------

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

    // Meta manda todo en entry > changes > value > messages
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // No hay mensaje de usuario (pueden ser status, etc.)
      return res.sendStatus(200);
    }

    const message = messages[0];
    const from = message.from; // número del cliente

    // Solo respondemos a mensajes de usuario, no a mensajes del sistema, etc.
    if (message.type === "text" || message.type === "interactive") {
      await handleIncomingMessage(message, from);
    }

    // Siempre responder 200 rápido para que Meta quede feliz
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
