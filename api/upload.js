// Upload file (immagini prodotto/news, PDF documenti) → Vercel Blob.
// Usa il protocollo client-upload di @vercel/blob: il browser carica direttamente
// sul Blob (supera il limite ~4.5MB del body delle functions); questa route
// genera il token SOLO se la richiesta è autenticata.
"use strict";

const { handleUpload } = require("@vercel/blob/client");
const { isAuthed } = require("./_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo non consentito" });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (/* pathname, clientPayload */) => {
        if (!isAuthed(req)) throw new Error("Non autorizzato");
        return {
          allowedContentTypes: [
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB
        };
      },
      onUploadCompleted: async () => {
        // notifica server-to-server (non raggiungibile su localhost: innocuo)
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (e) {
    return res.status(400).json({ error: (e && e.message) || "Upload fallito" });
  }
};
