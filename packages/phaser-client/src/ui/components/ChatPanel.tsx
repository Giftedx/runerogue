/**
 * @file Chat panel component for the game UI.
 * @author Your Name
 */

import React, { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useGameRoom } from "@/providers/GameRoomProvider";

/**
 * @function ChatPanel
 * @description A component that displays chat messages and an input to send them.
 * @returns {JSX.Element} The chat panel component.
 */
export const ChatPanel: React.FC = () => {
  const { messages } = useGameStore();
  const { sendMessage } = useGameRoom();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded p-2">
      <h3 className="text-lg font-bold mb-2">Chat</h3>
      <div className="flex-1 overflow-y-auto mb-2 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm mb-1">
            <strong
              className="chat-sender-name"
              style={{ "--sender-color": msg.color } as React.CSSProperties}
            >
              {msg.sender}:
            </strong>{" "}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded p-1 text-white"
          placeholder="Type a message..."
        />
      </form>
    </div>
  );
};
