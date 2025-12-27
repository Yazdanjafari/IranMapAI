const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector("#file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");
const speechToSpeechButton = document.querySelector("#speech-to-speech");

// API setup
const API_KEY = "AIzaSyAt-vJeLT_P5AlfyYDpOUZfQHmqg3ar_Kg";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data ? [{ inline_data: userData.file }] : []),
    ],
  });

  // API request options
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory,
    }),
  };

  try {
    // Fetch bot response from API
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Extract and display the bot response
    const apiResponseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    messageElement.innerText = apiResponseText;

    // Add bot response to chat history
    chatHistory.push({
      role: "model",
      parts: [
        { text: apiResponseText }
      ],
    });

    // Speak the bot's response if speech-to-speech is enabled
    if (speechToSpeechButton && recognition) {
      speechToSpeechButton.classList.add('processing');
      speechToSpeechButton.textContent = 'hourglass_empty';
      setTimeout(() => {
        if (typeof speakText === 'function') {
          speakText(apiResponseText);
        }
      }, 500);
    }
  } catch (error) {
    console.log(error);
    messageElement.innerText = error.message;
    messageElement.style.color = "#ff0000";
    if (speechToSpeechButton && typeof resetSpeechButton === 'function') {
      resetSpeechButton();
    }
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
  messageInput.value = "";
  messageInput.dispatchEvent(new Event("input"));

  // Create and display user message
  const messageContent = `<div class="message-text"></div>
                          ${
                            userData.file.data
                              ? `<img src=data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />`
                              : ""
                          }`;
  const outgoingMessageDiv = createMessageElement(
    messageContent,
    "user-message"
  );
  outgoingMessageDiv.querySelector(".message-text").textContent =
    userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  // Smooth scroll to bottom
  setTimeout(() => {
    if (chatBody) {
      chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
  }, 100);

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




sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document
  .querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());

chatbotToggler.addEventListener("click", () => { 
    document.body.classList.toggle("show-chatbot");
  });

  closeChatbot.addEventListener("click", () => { 
    document.body.classList.remove("show-chatbot");
  });

// Speech-to-Speech functionality
let recognition = null;
let synthesis = window.speechSynthesis;
let isListening = false;
let isSpeaking = false;
let currentUtterance = null;

// Initialize Speech Recognition
const initSpeechRecognition = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported in this browser');
    speechToSpeechButton.style.display = 'none';
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US'; // You can change this to 'fa-IR' for Persian/Farsi

  recognition.onstart = () => {
    isListening = true;
    speechToSpeechButton.classList.add('listening');
    speechToSpeechButton.classList.remove('speaking', 'processing');
    speechToSpeechButton.textContent = 'mic';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
    messageInput.dispatchEvent(new Event("input"));
    
    // Automatically send the message
    setTimeout(() => {
      handleOutgoingMessage(new Event('submit'));
    }, 300);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    resetSpeechButton();
    
    // Show error message
    const errorMessage = createMessageElement(
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
      <div class="message-text">Speech recognition error: ${event.error}. Please try again.</div>`,
      "bot-message"
    );
    chatBody.appendChild(errorMessage);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  };

  recognition.onend = () => {
    isListening = false;
    if (!isSpeaking) {
      resetSpeechButton();
    }
  };

  return true;
};

// Reset speech button to default state
const resetSpeechButton = () => {
  if (speechToSpeechButton) {
    speechToSpeechButton.classList.remove('listening', 'speaking', 'processing');
    speechToSpeechButton.textContent = 'mic';
  }
};

// Speak text using Web Speech API
const speakText = (text) => {
  if (isSpeaking) {
    synthesis.cancel();
  }

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'en-US'; // You can change this to 'fa-IR' for Persian/Farsi
  currentUtterance.rate = 1;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;

  currentUtterance.onstart = () => {
    isSpeaking = true;
    speechToSpeechButton.classList.add('speaking');
    speechToSpeechButton.classList.remove('listening', 'processing');
    speechToSpeechButton.textContent = 'volume_up';
  };

  currentUtterance.onend = () => {
    isSpeaking = false;
    resetSpeechButton();
  };

  currentUtterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    isSpeaking = false;
    resetSpeechButton();
  };

  synthesis.speak(currentUtterance);
};

// Stop speaking
const stopSpeaking = () => {
  if (isSpeaking) {
    synthesis.cancel();
    isSpeaking = false;
    resetSpeechButton();
  }
};

// Handle speech-to-speech button click
if (speechToSpeechButton) {
  speechToSpeechButton.addEventListener('click', () => {
    if (isSpeaking) {
      // If speaking, stop it
      stopSpeaking();
      return;
    }

    if (isListening) {
      // If listening, stop it
      if (recognition) {
        recognition.stop();
      }
      return;
    }

    // Start listening
    if (recognition) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        if (typeof resetSpeechButton === 'function') {
          resetSpeechButton();
        }
      }
    }
  });

  // Initialize speech recognition when page loads
  initSpeechRecognition();
}
