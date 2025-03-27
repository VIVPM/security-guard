import { useEffect, useRef, useState } from "react";
import ChatbotIcon from "./ChatbotIcon";
import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import { securitySystem as initialSecuritySystem } from "./securitySystem";
import "./Chatbot.css";

const Chatbot = () => {
    const chatBodyRef = useRef();
    const [showChatbot, setShowChatbot] = useState(false);
    const [securitySystem, setSecuritySystem] = useState(initialSecuritySystem); // Fixed typo
    const [chatHistory, setChatHistory] = useState([
        {
            hideInChat: true,
            role: "model",
            text: initialSecuritySystem, // Use initial value directly
        },
    ]);

    const generateBotResponse = async (history) => {
        const apiKey = process.env.REACT_APP_API_KEY;
        const updateHistory = (text, isError = false) => {
            setChatHistory((prev) => [
                ...prev.filter((msg) => msg.text !== "Thinking..."),
                { role: "model", text, isError },
            ]);
            if (!isError) {
                setSecuritySystem((prev) => `${prev}\n\nUser response appended: ${text}`); // Fixed to setSecuritySystem
            }
        };

        history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: history }),
        };

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                requestOptions
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error.message || "Something went wrong!");
            const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
            updateHistory(apiResponseText);
        } catch (error) {
            updateHistory(error.message, true);
        }
    };

    useEffect(() => {
        chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
    }, [chatHistory]);

    useEffect(() => {
        setChatHistory((prev) =>
            prev.map((msg) =>
                msg.hideInChat ? { ...msg, text: securitySystem } : msg
            )
        );
    }, [securitySystem]);

    return (
        <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
            <button onClick={() => setShowChatbot((prev) => !prev)} id="chatbot-toggler">
                <span className="material-symbols-rounded">mode_comment</span>
                <span className="material-symbols-rounded">close</span>
            </button>
            <div className="chatbot-popup">
                <div className="chat-header">
                    <div className="header-info">
                        <ChatbotIcon />
                        <h2 className="logo-text">Chatbot</h2>
                    </div>
                    <button onClick={() => setShowChatbot((prev) => !prev)} className="material-symbols-rounded">
                        keyboard_arrow_down
                    </button>
                </div>
                <div ref={chatBodyRef} className="chat-body">
                    <div className="message bot-message">
                        <ChatbotIcon />
                        <p className="message-text">
                            Hey there <br /> How can I help you today?
                        </p>
                    </div>
                    {chatHistory.map((chat, index) => (
                        <ChatMessage key={index} chat={chat} />
                    ))}
                </div>
                <div className="chat-footer">
                    <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
                </div>
            </div>
        </div>
    );
};

export default Chatbot;