import React, { useState, useEffect, useRef } from "react";
import "./Chatbot_old.css";
import userImage from "./15013685.png";
import botImage from "./chatbot.png";

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const chatboxRef = useRef(null);
    const apiKey = process.env.REACT_APP_API_KEY; // Your API key from env

    // When chat is opened, show an initial greeting from the bot if no messages yet.
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setTimeout(() => {
                setMessages([
                    {
                        name: "Bot",
                        message: "Hey there! How can I help you today? 😊",
                    },
                ]);
            }, 500);
        }
    }, [isOpen, messages.length]);

    const toggleChatbox = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = () => {
        if (!input.trim()) return;

        // Create user message object
        const userMessage = { name: "User", message: input };

        // Build the updated conversation history (without the "Typing..." message)
        const updatedConversation = [...messages, userMessage];

        // Add the user message to state and clear the input
        setMessages(updatedConversation);
        setInput("");

        // After a brief delay, show a "Typing..." message and fetch the bot response
        setTimeout(() => {
            // Append a typing indicator for the bot
            setMessages((prevMessages) => [
                ...prevMessages,
                { name: "Bot", message: "Typing..." },
            ]);
            // Pass the conversation history (without the typing message) to the fetch function
            fetchChatbotResponse(updatedConversation);
        }, 500);
    };

    // Function that maps the conversation history to the format expected by the API
    const fetchChatbotResponse = async (conversation) => {
        // Map each message to the API's expected format:
        // - "assistant" for bot messages
        // - "user" for user messages
        const conversationHistory = conversation.map((msg) => ({
            role: msg.name === "Bot" ? "assistant" : "user",
            parts: [{ text: msg.message }],
        }));

        const data = {
            contents: conversationHistory,
        };

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                }
            );
            const result = await response.json();

            // Extract the bot response from the result
            const botResponse =
                result?.candidates?.[0]?.content?.parts?.[0]?.text.replace(/\*/g, "") ||
                "Sorry, I couldn't get a response. Please try again.";

            // Replace the "Typing..." message with the actual bot response
            setMessages((prevMessages) =>
                prevMessages.slice(0, -1).concat({ name: "Bot", message: botResponse })
            );
        } catch (error) {
            console.error("Error fetching chatbot response:", error);
            setMessages((prevMessages) =>
                prevMessages
                    .slice(0, -1)
                    .concat({
                        name: "Bot",
                        message: "Sorry, something went wrong. Try again later.",
                    })
            );
        }
    };

    return (
        <div>
            <div className="chatbox__icon" onClick={toggleChatbox}>
                💬
            </div>

            <div className={`chatbox ${isOpen ? "active" : ""}`} ref={chatboxRef}>
                <div className="chatbox__support">
                    <div className="chatbox__header">
                        <img src={botImage} alt="Chatbot" />
                        <div className="chatbot-title">Chatbot</div>
                        <div className="chatbox__close" onClick={toggleChatbox}>
                            ✖
                        </div>
                    </div>
                    <div className="chatbox__messages">
                        {messages
                            .slice()
                            .reverse()
                            .map((msg, index) => (
                                <div
                                    key={index}
                                    className={
                                        msg.name === "User"
                                            ? "messages__item messages__item--operator"
                                            : "messages__item messages__item--visitor"
                                    }
                                >
                                    <img src={msg.name === "User" ? userImage : botImage} alt={msg.name} />
                                    {msg.message}
                                </div>
                            ))}
                    </div>
                    <div className="chatbox__footer">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <button className="chatbox__send--footer" onClick={handleSendMessage}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
