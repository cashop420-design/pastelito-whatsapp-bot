const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ------------------------------------------------------
// 🔥 CONFIG — PÓN TUS DATOS AQUÍ COMO VARIABLES DE ENTORNO EN RENDER
// ------------------------------------------------------
// En Render vas a crear:
// WHATSAPP_TOKEN   -> el token largo que te da Meta
// PHONE_NUMBER_ID  -> el ID del número (el que sale en Meta en "Identificador de número")
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// 🔸 URL de la imagen del menú (reemplázala por tu link DIRECTO de Imgur)
const IMAGE_MENU_URL = "https://i.imgur.com/RPp27bH.jpeg"; 
// EJEMPLO: "https://i.imgur.com/abcd1234.png"

// ------------------------------------------------------
// 🔔 WEBHOOK DE VERIFICACIÓN (GET)
// ------------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];

  // Debe coincidir con el token que pongas en Meta cuando configures el webhook
  const VERIFY_TOKEN = "pastelito_verify";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado correctamente");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ Error de verificación del webhook");
    return res.sendStatus(403);
  }
});

// ------------------------------------------------------
// 📩 WEBHOOK DE MENSAJES (POST)
// ------------------------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from; // número del cliente (formato WhatsApp)
    const text = (message.text?.body || "").toLowerCase();

    console.log("📩 Mensaje recibido de", from, "->", text);

    // Si el cliente dice algo tipo "hola", "menu", "menú", "buenas", etc.
    if (/hola|menu|menú|buenas|hey|quiero/i.test(text)) {
      await sendMenu(from);
    } else {
      // Respuesta básica por si escriben cualquier otra cosa
      await sendText(
        from,
        "🌈✨ Soy Pastelito High.\nEscríbeme *hola* o *menú* y te muestro todo lo que hay pa’ el viaje 🚀."
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en el webhook:", error.response?.data || error);
    res.sendStatus(500);
  }
});

// ------------------------------------------------------
// 🧩 FUNCIÓN: enviar solo texto
// ------------------------------------------------------
async function sendText(to, body) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error enviando texto:", error.response?.data || error);
  }
}

// ------------------------------------------------------
// 📸 FUNCIÓN: enviar el MENÚ (IMAGEN + TEXTO EXPLICATIVO)
// ------------------------------------------------------
async function sendMenu(to) {
  try {
    // 1️⃣ Enviar la imagen del menú con un caption corto
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: {
          link: IMAGE_MENU_URL,
          caption:
            "💫 *Menú del Viaje – Candy Shop 420* 💫\nAquí tienes todas nuestras delicias con truco pa’ elevar el mood 🧁✨",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 2️⃣ Enviar mensaje con info de pagos, envíos y cierre de venta
    const info =
      "💚 *Gracias por pasar al rincón más dulce del viaje* 💚\n\n" +
      "Formas de pago:\n" +
      "• 🔵 Nequi\n" +
      "• 💳 Transferencia bancaria\n" +
      "• 🛵 Pago contra entrega (Bogotá, según zona)\n\n" +
      "Envíos:\n" +
      "• 🚀 Mismo día en varias zonas de Bogotá\n" +
      "• 📦 Envíos nacionales por transportadora\n\n" +
      "Si ya viste el menú, dime qué se te antoja y te ayudo a armar el combo perfecto pa’ tu viaje 😋🚀";

    await sendText(to, info);
  } catch (error) {
    console.error("❌ Error enviando menú:", error.response?.data || error);
  }
}

// ------------------------------------------------------
// 🚀 LEVANTAR SERVIDOR (Render usa PORT)
// ------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Pastelito bot corriendo en puerto ${PORT}`);
});
