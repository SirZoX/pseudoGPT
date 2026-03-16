require('dotenv').config({ path: './crdntls/.env' });

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const OpenAI  = require('openai');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Leer system prompt al arrancar
const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf-8');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere el array messages.' });
  }

  const VALID_ROLES = new Set(['user', 'assistant']);
  for (const msg of messages) {
    if (!VALID_ROLES.has(msg.role) || typeof msg.content !== 'string' || !msg.content.trim()) {
      return res.status(400).json({ error: 'Formato de mensajes inválido.' });
    }
  }

  try {
    const response = await openai.responses.create({
      model: 'gpt-5',
      input: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    res.json({ reply: response.output_text });
  } catch (err) {
    console.error('Error al llamar a OpenAI:', err.message);
    res.status(500).json({ error: err.message || 'Error interno al llamar a la API.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor arrancado en http://localhost:${PORT}`);
});
