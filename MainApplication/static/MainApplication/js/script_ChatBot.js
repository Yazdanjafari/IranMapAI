const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector("#file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const fileUploadButton = document.querySelector("#file-upload");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");
const chatbotPopup = document.querySelector("#chatbot-popup");
const speechToSpeechButton = document.querySelector("#speech-to-speech");
const recordingTimer = document.querySelector("#recording-timer");
const clearChatButton = document.querySelector("#clear-chat");

// API setup
const CHAT_API_BASE = (document.body.getAttribute("data-chat-api-base") || window.location.origin).replace(/\/$/, "");
const API_URL = `${CHAT_API_BASE}/api/v1/query/text`;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 5000;
const SESSION_DURATION_MINUTES = 20;
const SESSION_DURATION_MS = SESSION_DURATION_MINUTES * 60 * 1000;
const userKey = document.body.getAttribute("data-chat-user") || "anonymous";
const pageType = document.body.getAttribute("data-page-type") || "unknown";
const pageCityName = document.body.getAttribute("data-city-name") || "";
const pageCitySlug = document.body.getAttribute("data-city-slug") || "";
const SESSION_STORAGE_KEY = `chatSession:${userKey}`;
const HISTORY_STORAGE_PREFIX = `chatHistory:${userKey}:`;
const CITY_CONTEXT_KEY = `cityContext:${userKey}`;

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

const initialInputHeight = messageInput.scrollHeight;
const initialChatBodyMarkup = chatBody ? chatBody.innerHTML : "";

const createSession = () => {
  const now = Date.now();
  const session = {
    id: `${now}-${Math.random().toString(16).slice(2, 10)}`,
    startedAt: now,
    lastActivity: now,
    activeCitySlug: pageCitySlug || null,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
};

const loadSession = () => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return { session: createSession(), isNew: true };
  }
  try {
    const session = JSON.parse(raw);
    const startedAt = session.startedAt || 0;
    if (!startedAt || Date.now() - startedAt > SESSION_DURATION_MS) {
      if (session.id) {
        localStorage.removeItem(`${HISTORY_STORAGE_PREFIX}${session.id}`);
      }
      return { session: createSession(), isNew: true };
    }
    return { session, isNew: false };
  } catch (error) {
    return { session: createSession(), isNew: true };
  }
};

const persistSession = (session) => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const updateSessionActivity = () => {
  session.lastActivity = Date.now();
  persistSession(session);
};

const getHistoryKey = () => `${HISTORY_STORAGE_PREFIX}${session.id}`;

const loadHistory = () => {
  const raw = localStorage.getItem(getHistoryKey());
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const persistHistory = () => {
  try {
    localStorage.setItem(getHistoryKey(), JSON.stringify(chatHistory));
  } catch (error) {
    console.warn("Unable to cache chat history in localStorage.", error);
  }
  updateSessionActivity();
};

const ensureActiveSession = () => {
  const startedAt = session.startedAt || 0;
  if (startedAt && Date.now() - startedAt <= SESSION_DURATION_MS) {
    return;
  }
  const previousHistoryKey = getHistoryKey();
  localStorage.removeItem(previousHistoryKey);
  session = createSession();
  chatHistory = [];
  persistHistory();
  if (chatBody) {
    chatBody.innerHTML = initialChatBodyMarkup;
  }
};

let { session, isNew: isNewSession } = loadSession();
let chatHistory = loadHistory();

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const getActiveCitySlug = () => pageCitySlug || session.activeCitySlug || null;

const loadCityContextMap = () => {
  const raw = localStorage.getItem(CITY_CONTEXT_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const persistCityContextMap = (map) => {
  localStorage.setItem(CITY_CONTEXT_KEY, JSON.stringify(map));
};

const updateCityContextFromPage = () => {
  if (!pageCitySlug || !window.citySummary || !Array.isArray(window.citySummary.fields)) {
    return;
  }
  const fields = window.citySummary.fields.map((field) => ({
    name: field.name,
    score: Number(field.score) || 0,
  }));
  const totalScore = fields.reduce((sum, field) => sum + field.score, 0);
  const averageScore = fields.length ? Math.round((totalScore / fields.length) * 100) / 100 : 0;
  const contextMap = loadCityContextMap();
  contextMap[pageCitySlug] = {
    name: pageCityName || window.citySummary.name,
    slug: pageCitySlug,
    averageScore,
    fields,
    updatedAt: Date.now(),
  };
  persistCityContextMap(contextMap);
  session.activeCitySlug = pageCitySlug;
  persistSession(session);
};

const getActiveCityContext = () => {
  const activeSlug = getActiveCitySlug();
  if (!activeSlug) return null;
  const contextMap = loadCityContextMap();
  return contextMap[activeSlug] || null;
};

const buildHistoryContextText = (currentQuery) => {
  let recent = chatHistory.slice(-6);
  if (currentQuery) {
    const lastItem = recent[recent.length - 1];
    if (lastItem && lastItem.role === "user" && lastItem.text === currentQuery) {
      recent = recent.slice(0, -1);
    }
  }
  if (!recent.length) return "";
  return recent
    .map((item) => {
      const label = item.role === "user" ? "کاربر" : "دستیار";
      if (item.type === "audio") {
        return `${label}: پیام صوتی`;
      }
      return `${label}: ${item.text}`;
    })
    .join("\n");
};

const buildCityContextText = () => {
  const cityContext = getActiveCityContext();
  if (!cityContext) return "";
  const fieldsText = cityContext.fields
    .map((field) => `${field.name}: ${field.score}`)
    .join("، ");
  return `شهر: ${cityContext.name}\nمیانگین امتیازها: ${cityContext.averageScore}\nامتیازها: ${fieldsText}`;
};

const buildAugmentedQuery = (query) => {
  const contextParts = [];
  const cityContextText = buildCityContextText();
  if (cityContextText) {
    contextParts.push(`اطلاعات شهر:\n${cityContextText}`);
  }
  const historyContextText = buildHistoryContextText(query);
  if (historyContextText) {
    contextParts.push(`گفتگوی اخیر:\n${historyContextText}`);
  }
  if (!contextParts.length) return query;
  return `<<<\n${contextParts.join("\n\n")}\n>>>\n\nپرسش کاربر: ${query}`;
};

const persistMessage = (role, text, options = {}) => {
  if (!text && options.type !== "audio") return;
  ensureActiveSession();
  const entry = {
    role,
    type: options.type || "text",
    text: text || "",
    timestamp: Date.now(),
    citySlug: getActiveCitySlug(),
  };
  if (options.audioData) {
    entry.audioData = options.audioData;
  }
  if (typeof options.duration === "number") {
    entry.duration = options.duration;
  }
  chatHistory.push(entry);
  persistHistory();
};

const appendMessage = (text, messageClass, options = {}) => {
  if (!chatBody) return;
  const message = createMessageElement(`<div class="message-text"></div>`, messageClass);
  message.querySelector(".message-text").textContent = text;
  chatBody.appendChild(message);
  if (options.persist !== false) {
    const role = messageClass.includes("user") ? "user" : "bot";
    persistMessage(role, text);
  }
  setTimeout(() => {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }, 100);
};

const clearChatHistory = () => {
  chatHistory = [];
  localStorage.removeItem(getHistoryKey());
  if (chatBody) {
    chatBody.innerHTML = initialChatBodyMarkup;
  }
  stopAudioPlayback();
  updateSessionActivity();
};

if (clearChatButton) {
  clearChatButton.addEventListener("click", () => {
    clearChatHistory();
  });
}

const extractResponseText = (data) => {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.data) {
    const nested = extractResponseText(data.data);
    if (nested) return nested;
  }
  if (typeof data.response === "string") return data.response;
  if (typeof data.answer === "string") return data.answer;
  if (typeof data.content === "string") return data.content;
  if (typeof data.text === "string") return data.text;
  if (typeof data.result === "string") return data.result;
  if (data.message && typeof data.message === "string") {
    const normalized = data.message.trim().toLowerCase();
    if (normalized !== "query processed successfully") {
      return data.message;
    }
  }
  if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (Array.isArray(data.candidates) && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  return null;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  const augmentedQuery = buildAugmentedQuery(userData.message);
  const cityContext = getActiveCityContext();
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: augmentedQuery,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
      metadata: cityContext
        ? {
            city: {
              name: cityContext.name,
              slug: cityContext.slug,
              average_score: cityContext.averageScore,
              fields: cityContext.fields,
            },
          }
        : undefined,
    }),
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorText =
        (data && (data.message || data.error || data.detail)) ||
        "خطا در ارتباط با سرویس دستیار.";
      throw new Error(errorText);
    }

    // Extract and display the bot response
    const apiResponseText = (extractResponseText(data) || "پاسخی دریافت نشد.")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    messageElement.innerText = apiResponseText;
    persistMessage("bot", apiResponseText);

  } catch (error) {
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
    persistMessage("bot", error.message);
  } finally {
    incomingMessageDiv.classList.remove("thinking");
    // Smooth scroll to bottom
    setTimeout(() => {
      if (chatBody) {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      }
    }, 100);
  }
};

// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message) {
    return;
  }
  ensureActiveSession();
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));

  appendMessage(userData.message, "user-message");

  // Simulate bot response with thinking indicator after a dely
  setTimeout(() => {
    const messageContent = `<svg 
            class="bot-avatar"
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="0 0 1024 1024"
          >
          <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
            ></path>
          </svg>
          <div class="message-text">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>`;
    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking"
    );
    chatBody.appendChild(incomingMessageDiv);
    setTimeout(() => {
      if (chatBody) {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
      }
    }, 100);
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});


// Auto resize message input
messageInput.addEventListener("input", (e) => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;
  const chatForm = document.querySelector(".chat-form");
  if (chatForm) {
    chatForm.style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
  }
});

// Handle file input change
if (fileInput) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result.split(",")[1];

      // Store file data in userData
      userData.file = {
        data: base64String,
        mime_type: file.type,
      };

      fileInput.value = "";
    };

    reader.readAsDataURL(file);
  });
}

// Emoji picker setup
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  preview: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  }
});

document.querySelector(".chat-form").appendChild(picker);

const setChatbotState = (isOpen) => {
  if (chatbotToggler) {
    chatbotToggler.setAttribute("aria-expanded", String(Boolean(isOpen)));
  }
  if (chatbotPopup) {
    chatbotPopup.setAttribute("aria-hidden", String(!isOpen));
  }
};

setChatbotState(document.body.classList.contains("show-chatbot"));




sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
if (fileUploadButton && fileInput) {
  fileUploadButton.addEventListener("click", () => fileInput.click());
}

chatbotToggler.addEventListener("click", () => { 
    document.body.classList.toggle("show-chatbot");
    const isOpen = document.body.classList.contains("show-chatbot");
    setChatbotState(isOpen);
    if (isOpen && messageInput) {
      messageInput.focus();
    }
  });

  closeChatbot.addEventListener("click", () => { 
    document.body.classList.remove("show-chatbot");
    setChatbotState(false);
    if (chatbotToggler) {
      chatbotToggler.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("show-chatbot")) {
      document.body.classList.remove("show-chatbot");
      setChatbotState(false);
      if (chatbotToggler) {
        chatbotToggler.focus();
      }
    }
  });

// Voice query functionality
const VOICE_API_URL = `${CHAT_API_BASE}/api/v1/query/voice`;
const VOICE_LANGUAGE = "fa-IR";
const MAX_AUDIO_CACHE_BYTES = 1500000;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let isPlayingAudio = false;
let currentAudio = null;
let recordingTimerInterval = null;
let recordingStartTime = null;

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Unable to read audio blob."));
  reader.readAsDataURL(blob);
});

const cacheVoiceResponse = async (audioBlob) => {
  if (!audioBlob || audioBlob.size > MAX_AUDIO_CACHE_BYTES) {
    return null;
  }
  try {
    const dataUrl = await blobToDataUrl(audioBlob);
    if (typeof dataUrl === "string") {
      persistMessage("bot", "", { type: "audio", audioData: dataUrl });
      return dataUrl;
    }
  } catch (error) {
    console.warn("Unable to cache voice response.", error);
  }
  return null;
};

const appendAudioMessage = (options) => {
  if (!chatBody) return;
  const audioBlob = options && options.blob ? options.blob : null;
  const audioDataUrl = options && options.dataUrl ? options.dataUrl : null;
  const autoPlay = options && options.autoPlay !== undefined ? options.autoPlay : true;
  const shouldPersist = options && options.persist === true;
  const audioSrc = audioDataUrl || (audioBlob ? URL.createObjectURL(audioBlob) : null);
  if (!audioSrc) {
    return;
  }
  const message = createMessageElement(
    `<svg 
        class="bot-avatar"
        xmlns="http://www.w3.org/2000/svg"
        width="50"
        height="50"
        viewBox="0 0 1024 1024"
      >
        <path
          d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
        ></path>
      </svg>
      <div class="message-text voice-message">
        <div class="voice-card">
          <button type="button" class="voice-play" aria-label="پخش صدا">
            <span class="material-symbols-rounded">play_arrow</span>
          </button>
          <div class="voice-controls">
            <div class="voice-progress">
              <div class="voice-progress-bar"></div>
            </div>
            <div class="voice-time">00:00 / 00:00</div>
            <div class="voice-bars" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        <audio class="voice-audio" preload="metadata"></audio>
      </div>`,
    "bot-message"
  );
  const audioEl = message.querySelector(".voice-audio");
  const voiceCard = message.querySelector(".voice-card");
  const playButton = message.querySelector(".voice-play");
  const playIcon = playButton.querySelector("span");
  const progressBar = message.querySelector(".voice-progress-bar");
  const timeLabel = message.querySelector(".voice-time");
  const bars = Array.from(message.querySelectorAll(".voice-bars span"));

  audioEl.src = audioSrc;
  audioEl.onloadedmetadata = () => {
    timeLabel.textContent = `00:00 / ${formatAudioTime(audioEl.duration)}`;
  };
  audioEl.ontimeupdate = () => {
    if (!audioEl.duration) return;
    const progress = Math.min(100, (audioEl.currentTime / audioEl.duration) * 100);
    progressBar.style.width = `${progress}%`;
    timeLabel.textContent = `${formatAudioTime(audioEl.currentTime)} / ${formatAudioTime(audioEl.duration)}`;
  };
  audioEl.onplay = () => {
    isPlayingAudio = true;
    voiceCard.classList.add("is-playing");
    playIcon.textContent = "pause";
    currentAudio = {
      audio: audioEl,
      card: voiceCard,
      buttonIcon: playIcon,
      progressBar,
      time: timeLabel,
      bars,
      visualizer: null,
    };
    startVoiceVisualizer(currentAudio);
    setSpeechButtonState("playing");
  };
  audioEl.onpause = () => {
    voiceCard.classList.remove("is-playing");
    playIcon.textContent = "play_arrow";
    isPlayingAudio = false;
    if (currentAudio && currentAudio.audio === audioEl) {
      stopVoiceVisualizer(currentAudio);
      currentAudio = null;
      setSpeechButtonState("idle");
    }
  };
  audioEl.onended = () => {
    voiceCard.classList.remove("is-playing");
    playIcon.textContent = "play_arrow";
    isPlayingAudio = false;
    if (currentAudio && currentAudio.audio === audioEl) {
      stopVoiceVisualizer(currentAudio);
      currentAudio = null;
    }
    setSpeechButtonState("idle");
  };
  audioEl.onerror = () => {
    voiceCard.classList.remove("is-playing");
    playIcon.textContent = "play_arrow";
    isPlayingAudio = false;
    if (currentAudio && currentAudio.audio === audioEl) {
      stopVoiceVisualizer(currentAudio);
      currentAudio = null;
    }
    setSpeechButtonState("idle");
  };

  playButton.addEventListener("click", () => {
    if (currentAudio && currentAudio.audio !== audioEl) {
      currentAudio.audio.pause();
    }
    if (audioEl.paused) {
      audioEl.play().catch(() => {
        setSpeechButtonState("idle");
      });
    } else {
      audioEl.pause();
    }
  });

  chatBody.appendChild(message);
  if (shouldPersist && audioDataUrl) {
    persistMessage("bot", "", { type: "audio", audioData: audioDataUrl });
  }
  setTimeout(() => {
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }, 100);

  if (currentAudio && currentAudio.audio !== audioEl) {
    currentAudio.audio.pause();
  }
  if (autoPlay) {
    audioEl.play().catch(() => {
      setSpeechButtonState("idle");
    });
  }
};

const setRecordingTimerVisible = (isVisible) => {
  if (!recordingTimer) return;
  recordingTimer.classList.toggle("is-active", Boolean(isVisible));
  recordingTimer.setAttribute("aria-hidden", String(!isVisible));
  if (!isVisible) {
    recordingTimer.textContent = "00:00";
  }
};

const formatElapsedTime = (startTime) => {
  const elapsed = Math.max(0, Date.now() - startTime);
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const startVoiceVisualizer = (holder) => {
  if (!holder || !holder.bars || holder.bars.length === 0) {
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return;
  }
  const audioEl = holder.audio;
  if (!audioEl.__visualizer) {
    const context = new AudioContext();
    const source = context.createMediaElementSource(audioEl);
    const analyser = context.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyser.connect(context.destination);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.max(1, Math.floor(dataArray.length / holder.bars.length));
    audioEl.__visualizer = {
      context,
      source,
      analyser,
      dataArray,
      step,
      rafId: null,
    };
  }

  holder.visualizer = audioEl.__visualizer;
  if (holder.visualizer.context && holder.visualizer.context.state === "suspended") {
    holder.visualizer.context.resume();
  }

  holder.card.classList.add("is-visualized");
  holder.bars.forEach((bar) => {
    bar.style.animation = "none";
  });

  const update = () => {
    if (!holder.visualizer) return;
    const { analyser, dataArray, step } = holder.visualizer;
    analyser.getByteFrequencyData(dataArray);
    holder.bars.forEach((bar, index) => {
      const start = index * step;
      const end = Math.min(dataArray.length, start + step);
      let sum = 0;
      for (let i = start; i < end; i += 1) {
        sum += dataArray[i];
      }
      const avg = sum / Math.max(1, end - start);
      const height = 6 + (avg / 255) * 14;
      bar.style.height = `${height}px`;
    });
    holder.visualizer.rafId = requestAnimationFrame(update);
  };

  if (holder.visualizer.rafId) {
    cancelAnimationFrame(holder.visualizer.rafId);
  }
  update();
};

const stopVoiceVisualizer = (holder) => {
  if (!holder || !holder.visualizer) return;
  const { rafId, context } = holder.visualizer;
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  if (context && context.state === "running") {
    context.suspend();
  }
  holder.visualizer.rafId = null;
  holder.card.classList.remove("is-visualized");
  holder.bars.forEach((bar) => {
    bar.style.height = "";
    bar.style.animation = "";
  });
};

const setSpeechButtonState = (state) => {
  if (!speechToSpeechButton) return;
  speechToSpeechButton.classList.remove('listening', 'speaking', 'processing');
  if (state === "recording") {
    speechToSpeechButton.classList.add('listening');
    speechToSpeechButton.textContent = 'mic';
    setRecordingTimerVisible(true);
  } else if (state === "processing") {
    speechToSpeechButton.classList.add('processing');
    speechToSpeechButton.textContent = 'hourglass_empty';
    setRecordingTimerVisible(false);
  } else if (state === "playing") {
    speechToSpeechButton.classList.add('speaking');
    speechToSpeechButton.textContent = 'volume_up';
    setRecordingTimerVisible(false);
  } else {
    speechToSpeechButton.textContent = 'mic';
    setRecordingTimerVisible(false);
  }
};

const stopAudioPlayback = () => {
  if (currentAudio) {
    stopVoiceVisualizer(currentAudio);
    currentAudio.audio.pause();
    currentAudio.audio.currentTime = 0;
    currentAudio.card.classList.remove("is-playing");
    currentAudio.buttonIcon.textContent = "play_arrow";
    currentAudio.progressBar.style.width = "0%";
    currentAudio.time.textContent = `00:00 / ${formatAudioTime(currentAudio.audio.duration)}`;
    currentAudio = null;
  }
  isPlayingAudio = false;
  setSpeechButtonState("idle");
};

const renderStoredHistory = () => {
  if (!chatBody) return;
  if (!chatHistory.length) {
    chatBody.innerHTML = initialChatBodyMarkup;
    return;
  }
  chatBody.innerHTML = "";
  chatHistory.forEach((item) => {
    const messageClass = item.role === "user" ? "user-message" : "bot-message";
    if (item.type === "audio" && item.audioData) {
      appendAudioMessage({ dataUrl: item.audioData, autoPlay: false, persist: false });
      return;
    }
    appendMessage(item.text, messageClass, { persist: false });
  });
};

updateCityContextFromPage();
if (pageCitySlug) {
  session.activeCitySlug = pageCitySlug;
  persistSession(session);
}
if (isNewSession) {
  chatHistory = [];
  persistHistory();
}
renderStoredHistory();

const startRecordingTimer = () => {
  if (!recordingTimer) return;
  recordingStartTime = Date.now();
  recordingTimer.textContent = "00:00";
  if (recordingTimerInterval) {
    clearInterval(recordingTimerInterval);
  }
  recordingTimerInterval = setInterval(() => {
    recordingTimer.textContent = formatElapsedTime(recordingStartTime);
  }, 1000);
};

const stopRecordingTimer = () => {
  if (recordingTimerInterval) {
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
  }
  recordingStartTime = null;
  setRecordingTimerVisible(false);
};

const sendVoiceQuery = async (audioBlob, filename) => {
  ensureActiveSession();
  setSpeechButtonState("processing");
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  formData.append("language", VOICE_LANGUAGE);
  const cityContextText = buildCityContextText();
  const historyContextText = buildHistoryContextText();
  const contextParts = [];
  if (cityContextText) {
    contextParts.push(`اطلاعات شهر:\n${cityContextText}`);
  }
  if (historyContextText) {
    contextParts.push(`گفتگوی اخیر:\n${historyContextText}`);
  }
  if (contextParts.length) {
    formData.append("context", contextParts.join("\n\n"));
  }

  try {
    const response = await fetch(VOICE_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      appendMessage(errorText || "خطا در ارتباط با سرویس صوتی.", "bot-message");
      setSpeechButtonState("idle");
      return;
    }

    const transcription = response.headers.get("X-Transcription");
    if (transcription) {
      appendMessage(transcription, "user-message");
    }

    const audioResponse = await response.blob();
    appendAudioMessage({ blob: audioResponse, autoPlay: true, persist: false });
    cacheVoiceResponse(audioResponse);
  } catch (error) {
    appendMessage("ارتباط با سرویس صوتی ناموفق بود.", "bot-message");
    setSpeechButtonState("idle");
  }
};

const startVoiceCapture = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    appendMessage("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.", "bot-message");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];

    const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

    mediaRecorder = preferredType
      ? new MediaRecorder(stream, { mimeType: preferredType })
      : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder.mimeType || "audio/webm";
      const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
      const audioBlob = new Blob(recordedChunks, { type: mimeType });
      stream.getTracks().forEach((track) => track.stop());
      isRecording = false;
      stopRecordingTimer();
      await sendVoiceQuery(audioBlob, `recording.${extension}`);
    };

    mediaRecorder.start();
    isRecording = true;
    setSpeechButtonState("recording");
    startRecordingTimer();
  } catch (error) {
    appendMessage("دسترسی به میکروفن امکان‌پذیر نیست.", "bot-message");
    stopRecordingTimer();
    setSpeechButtonState("idle");
  }
};

const stopVoiceCapture = () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    setSpeechButtonState("processing");
    stopRecordingTimer();
  }
};

if (speechToSpeechButton) {
  speechToSpeechButton.addEventListener('click', () => {
    if (isRecording) {
      stopVoiceCapture();
      return;
    }

    if (isPlayingAudio) {
      stopAudioPlayback();
      return;
    }

    startVoiceCapture();
  });
}
