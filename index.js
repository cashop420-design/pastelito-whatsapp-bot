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

// ID del número de WhatsApp (el "Identificador de número de teléfono" que viste en Meta,
// por ahora el de PRUEBA, más adelante lo cambias por el de tu número real desde Render)
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// URL de la imagen del menú
const MENU_IMAGE_URL = "https://i.imgur.com/RPp27bH.jpeg";

// -------------------- app express --------------------
const app = express();
app.use(express.json());

// -------------------- helper para enviar mensajes --------------------
async function sendWhatsApp(payload) {
  try {
    const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

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
  const text = message.text?.body?.toLowerCase() || "";

  console.log("📩 Mensaje recibido de", from, "=>", text);

  // Por ahora: cualquier cosa que escriban, les mandamos bienvenida + menú
  // Luego le metemos más lógica (pedidos, pagos, etc.)

  // 1) Imagen del menú con copy de Pastelito
  const imageMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "image",
    image: {
      link: MENU_IMAGE_URL,
      caption:
        "💚 Aquí te dejo el menú actualizado de nuestros antojitos con truco 🌈\n" +
        "Hay pa’ todos los gustos y niveles de vuelo 🚀\n\n" +
        "Revísalo con calma y dime qué se te antoja… que yo te ayudo a armar el combo perfecto pa’ tu viaje 🧁🍬🍪💨\n" +
        "¡Pastelito High te guía! 😋💫",
    },
  };

  // 2) Mensaje de bienvenida + instrucciones básicas (se puede mejorar después)
  const welcomeText =
    "🌈✨ Bienvenid@ al rincón más dulce del viaje, soy Pastelito High 🍪💨.\n" +
    "Aquí todo está listo pa’ endulzarte la vida y llevarte a otro nivel 🚀.\n\n" +
    "👉 *Cómo funciona esto:*\n" +
    "1️⃣ Me dices qué se te antoja del menú (por nombre del producto).\n" +
    "2️⃣ Te ayudo a armar combo según tu vuelo y presupuesto.\n" +
    "3️⃣ Te confirmo total, forma de pago y envío.\n\n" +
    "💸 *Pagos:*\n" +
    "- Nequi\n" +
    "- Transferencias a otros bancos (según lo que tengamos activo)\n\n" +
    "🚚 *Envíos:* Bogotá por app de domicilios (te digo el valor según tu dirección). " +
    "Contraentrega la manejamos solo en algunos puntos y horarios especiales.\n\n" +
    "Cuando quieras, respóndeme con lo que se te antoja y lo vamos armando 🍬";

  const textMessage = {
    messaging_product: "whatsapp",
    to: from,
    type: "text",
    text: {
      body: welcomeText,
    },
  };

  await sendWhatsApp(imageMessage);
  await sendWhatsApp(textMessage);
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
