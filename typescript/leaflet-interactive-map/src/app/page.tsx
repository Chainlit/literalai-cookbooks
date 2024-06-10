"use client";

import React, { Fragment, useEffect, useRef, useState } from "react";
import { readStreamableValue } from "ai/rsc";
import { CoreMessage } from "ai";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { continueConversation as continueConversationAction } from "./actions";

export default function Home() {
  const [map, setMap] = useState<Map>();
  const chatBox = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<CoreMessage[]>([]);
  const [input, setInput] = useState("");

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const conversationContinuing = useRef(false);

  const continueConversation = async (...extraMessages: CoreMessage[]) => {
    // Prevent multiple completions from happening at the same time
    if (conversationContinuing.current) return;
    conversationContinuing.current = true;

    const { messages, newMessage } = await continueConversationAction([
      ...conversation,
      ...extraMessages,
    ]);

    // Display the streamed messages
    let textContent = "";
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([
        ...messages,
        { role: "assistant", content: textContent },
      ]);
      if (chatBox.current) {
        chatBox.current.scrollTop = chatBox.current.scrollHeight;
      }
    }

    conversationContinuing.current = false;
  };

  useEffect(() => {
    // Update the latitude and longitude every second
    const timeout = setInterval(() => {
      if (!map) return;
      const center = map.getCenter();
      setLat(center.lat);
      setLng(center.lng);
    }, 1e3);
    return () => clearInterval(timeout);
  }, [map]);

  useEffect(() => {
    if (!lat || !lng) return;

    setConversation((previous) => {
      const messages = [...previous];
      const lastMessage = messages.pop();
      if (lastMessage && lastMessage.role !== "system") {
        // We should keep the last message as it is not the position
        messages.push(lastMessage);
      }
      messages.push({
        role: "system",
        content: `The user moved to coordinated latitude ${lat} and longitude ${lng}`,
      });
      return messages;
    });

    // Randomly prompt the bot the react to the move
    if (Math.random() < 0.1) {
      continueConversation();
    }
  }, [lat, lng]);

  const handleChatSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!input.trim()) return;
    event.preventDefault();
    setInput("");

    setConversation([...conversation, { role: "user", content: input }]);
    await continueConversation({ role: "user", content: input });
  };

  return (
    <main className="h-screen w-screen">
      <MapContainer
        className="h-full w-full"
        center={[48.85, 2.35]}
        zoom={13}
        ref={(map) => setMap(map!)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      <div className="fixed bg-white rounded-lg border shadow-lg z-[1000] w-1/2 bottom-6 left-1/2 -translate-x-1/2 p-4 text-sm">
        <div
          ref={chatBox}
          className="max-h-48 overflow-y-auto empty:hidden mb-2 grid grid-cols-[max-content_auto] gap-x-2 gap-y-1"
        >
          {conversation
            .filter((message) => message.role !== "system")
            .map((message, index) => (
              <Fragment key={index}>
                <span>{message.role}:</span>
                <p className="whitespace-break-spaces">
                  {String(message.content)}
                </p>
              </Fragment>
            ))}
        </div>

        <form className="flex gap-2" onSubmit={handleChatSubmit}>
          <input
            className="flex-1 border px-2 py-1 rounded-sm"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit" className="border px-2 py-1 hover:bg-slate-50">
            Send Message
          </button>
        </form>
      </div>
    </main>
  );
}
