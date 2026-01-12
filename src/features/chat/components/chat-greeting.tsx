"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { FlipWords } from "ui/flip-words";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { BasicUser } from "app-types/user";
import { fetcher } from "lib/utils";

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

interface ChatGreetingProps {
  agentName?: string;
  agentAvatar?: any; // Allow object
}

export const ChatGreeting = ({ agentName, agentAvatar }: ChatGreetingProps) => {
  const { data: user } = useSWR<BasicUser>(`/api/user/details`, fetcher, {
    revalidateOnMount: false,
  });
  const t = useTranslations("Chat.Greeting");

  const word = useMemo(() => {
    if (agentName) {
      return `Welcome to ${agentName}. How can I help you today?`;
    }
    if (!user?.name) return "";
    const words = [
      t(getGreetingByTime(), { name: user.name }),
      t("niceToSeeYouAgain", { name: user.name }),
      t("whatAreYouWorkingOnToday", { name: user.name }),
      t("letMeKnowWhenYoureReadyToBegin"),
      t("whatAreYourThoughtsToday"),
      t("whereWouldYouLikeToStart"),
      t("whatAreYouThinking", { name: user.name }),
    ];
    return words[Math.floor(Math.random() * words.length)];
  }, [user?.name, agentName]);

  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto my-4 h-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="rounded-xl p-6 flex flex-col items-start gap-4 leading-relaxed text-start">
        {agentAvatar && (
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-4xl">
            {agentAvatar.type === "emoji" ? (
              <span>{agentAvatar.value}</span>
            ) : agentAvatar.type === "image" ? (
              <img
                src={agentAvatar.value}
                alt={agentName}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : null}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl">
          {word ? <FlipWords words={[word]} className="text-primary" /> : ""}
        </h1>
      </div>
    </motion.div>
  );
};
