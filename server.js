require('dotenv').config({ path: './crdntls/.env' });

const express    = require('express');
const path       = require('path');
const fs         = require('fs');
const OpenAI     = require('openai');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Leer system prompt al arrancar
const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf-8');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Transporte SMTP (se crea una sola vez)
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/chat', async (req, res) => {
  const { messages, specContext } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere el array messages.' });
  }

  const VALID_ROLES = new Set(['user', 'assistant']);
  for (const msg of messages) {
    if (!VALID_ROLES.has(msg.role) || typeof msg.content !== 'string' || !msg.content.trim()) {
      return res.status(400).json({ error: 'Formato de mensajes inválido.' });
    }
  }

  // Build input: system prompt + optional compressed spec context + current point messages only
  const input = [{ role: 'system', content: systemPrompt }];

  if (specContext && typeof specContext === 'string' && specContext.trim()) {
    input.push({ role: 'user', content: `[PUNTOS_CONFIRMADOS]\n${specContext.trim()}` });
    input.push({ role: 'assistant', content: 'Contexto recibido. Continúo desde el siguiente punto pendiente.' });
  }

  input.push(...messages);

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error('Error al llamar a OpenAI:', err.message);
    res.status(500).json({ error: err.message || 'Error interno al llamar a la API.' });
  }
});

app.post('/api/send-spec', async (req, res) => {
  const { to, specText } = req.body;

  // Basic validation
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'Dirección de email inválida.' });
  }
  if (!specText || typeof specText !== 'string' || specText.trim().length < 10) {
    return res.status(400).json({ error: 'El texto de la especificación está vacío.' });
  }

  // Sanitize: strip any HTML to prevent injection in case client is tampered
  const safeText = specText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeEmail = to.trim().substring(0, 254);

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  try {
    await smtpTransport.sendMail({
      from: `"Validador de Robots de Trading" <${process.env.SMTP_FROM}>`,
      to: safeEmail,
      subject: `Especificación Robot de Trading — ${dateStr}`,
      text: specText.trim(),
      html: `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap;">${safeText.trim()}</pre>`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al enviar email:', err.message);
    res.status(500).json({ error: 'No se pudo enviar el email: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor arrancado en http://localhost:${PORT}`);
});
