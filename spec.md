# Especificación — Mini Frontend Validador de Robots de Trading

## 1. Objetivo

Desarrollar un **mini frontend web** que actúe como interfaz de chat
para interactuar con la API de OpenAI (modelo `gpt-5`).

El sistema está orientado a validar especificaciones de robots de trading,
usando un prompt de sistema definido en un fichero externo (`prompt.txt`).

---

## 2. Layout

Diseño de **dos columnas**:

- **Columna izquierda**: panel de instrucciones estáticas con los puntos
  de evaluación que el usuario puede leer y copiar al textarea.

- **Columna derecha (principal)**:
  - Zona superior: historial de conversación (mensajes del usuario
    y respuestas de GPT, en orden cronológico).
  - Zona inferior: textarea de entrada + botón de envío.

---

## 3. Textarea — Comportamiento de entrada

- **Enter** → envía el mensaje directamente a la API.
- **Shift + Enter** → inserta un salto de línea (sin enviar).
- El textarea debe limpiarse tras el envío.
- Comportamiento idéntico al chat de ChatGPT / Claude.

---

## 4. Integración con OpenAI API

- Modelo: `gpt-5`
- Endpoint utilizado: `client.responses.create` (Responses API de OpenAI)
- El mensaje de sistema (`systemPrompt`) se lee desde el fichero `prompt.txt`
  ubicado junto a la aplicación.
- Estructura del payload:
  ```json
  {
    "model": "gpt-5",
    "input": [
      { "role": "system", "content": "<contenido de prompt.txt>" },
      { "role": "user",   "content": "<texto del usuario>" }
    ]
  }
  ```
- Las credenciales (API key, etc.) se cargan desde un fichero `.env`
  ubicado en `/crdntls`, al mismo nivel que la web.

---

## 5. Credenciales

- El fichero `.env` se ubica en `/crdntls/.env`, al mismo nivel que la web.
- Debe contener al menos:
  ```
  OPENAI_API_KEY=sk-...
  ```
- La aplicación **no debe exponer** la API key en el frontend directamente.
- Se requiere un **backend ligero** (Node.js + Express) que actúe de intermediario:
  1. Lee el `.env` en el servidor.
  2. Recibe la petición del frontend.
  3. Llama a la API de OpenAI con la key.
  4. Devuelve la respuesta al frontend.
- Esto evita exponer credenciales en el cliente (seguridad OWASP).

---

## 6. Tecnologías

### Backend
- **Node.js + Express** — ligero, fácil de arrancar, ideal para este caso.
- `dotenv` para leer el `.env` desde `crdntls/.env`.
- `openai` SDK oficial de Node.js para llamar a la API.

### Frontend
- **HTML + CSS + JavaScript vanilla** — sin frameworks, simple y directo.
- Sin dependencias de build (no React, no Webpack).
- Comunicación con el backend via `fetch` a un endpoint local (`POST /api/chat`).

### Ficheros externos
- `prompt.txt` — leído en el servidor al arrancar (o en cada petición).
- `crdntls/.env` — leído por `dotenv` solo en el servidor.

### Estructura de carpetas
```
/proyecto
  ├── server.js          ← backend Express
  ├── package.json
  ├── prompt.txt         ← system prompt
  ├── public/
  │   └── index.html     ← frontend
  └── crdntls/
      └── .env           ← API key (nunca expuesta al cliente)
```

---

## 7. Panel izquierdo — Guía de uso

Al abrir la web, la columna izquierda muestra un bloque de texto estático
con los **puntos mínimos que debe cubrir una especificación** de robot de trading.

### Propósito
- Servir de guía/checklist antes de escribir en el textarea.
- El usuario puede **copiar el bloque completo** y pegarlo en el textarea,
  editarlo y enviarlo.

### Puntos de evaluación
1. Activo / instrumento operado
2. Timeframe principal
3. Lógica de entrada (condiciones de apertura de posición)
4. Lógica de salida (take profit, stop loss, trailing)
5. Gestión del riesgo (% por operación, drawdown máximo)
6. Filtros de mercado (tendencia, volatilidad, horario)
7. Frecuencia estimada de operaciones
8. Backtesting realizado (sí/no, período, resultado)
9. Broker / plataforma objetivo
10. Observaciones adicionales

### UX
- Botón "Copiar plantilla" que vuelca el texto al textarea con un click.
- El panel es **solo lectura** (no editable directamente).

---

## 8. Historial de conversación

### Ubicación
Zona superior de la columna principal (derecha), encima del textarea.

### Comportamiento
- Los mensajes se añaden cronológicamente de arriba a abajo.
- Cada mensaje muestra visualmente quién lo envió:
  - **Usuario**: alineado a la derecha, fondo diferenciado (ej. azul claro).
  - **GPT**: alineado a la izquierda, fondo neutro (ej. gris claro).
- El área tiene **scroll automático** hacia el último mensaje.
- Soporta texto con saltos de línea (`\n` renderizados correctamente).

### Estados
- Mientras se espera respuesta: indicador de "escribiendo..." o spinner.
- Si hay error de API: mensaje de error en el historial sin bloquear la UI.

### Persistencia
- Solo en memoria de sesión.
- Al recargar la página, el historial se limpia.

---

## 9. Checklist de implementación

### Backend (server.js)
- [ ] Leer `.env` desde `crdntls/.env` con `dotenv`
- [ ] Leer `prompt.txt` al arrancar
- [ ] Endpoint `POST /api/chat` que recibe `{ userInput }`
- [ ] Llamar a OpenAI Responses API con `role: system` + `role: user`
- [ ] Devolver la respuesta al frontend en JSON
- [ ] Manejo de errores (API caída, key inválida, etc.)

### Frontend (public/index.html)
- [ ] Layout dos columnas (panel izquierdo + zona chat derecha)
- [ ] Panel izquierdo con los 10 puntos de evaluación (solo lectura)
- [ ] Botón "Copiar plantilla" → vuelca texto al textarea
- [ ] Zona de historial con scroll automático
- [ ] Burbujas diferenciadas usuario / GPT
- [ ] Textarea con Enter=enviar, Shift+Enter=salto de línea
- [ ] Botón "Enviar"
- [ ] Indicador de "escribiendo..." mientras espera respuesta
- [ ] Mostrar errores en el historial sin bloquear la UI
- [ ] Limpiar textarea tras envío

### Seguridad
- [ ] API key nunca sale del servidor
- [ ] `crdntls/.env` fuera del `public/`
- [ ] No loguear la key en consola
