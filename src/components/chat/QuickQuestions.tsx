"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import {
  BriefcaseBusiness,
  BriefcaseIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CircleEllipsis,
  CodeIcon,
  FileText,
  GraduationCapIcon,
  Layers,
  MailIcon,
  Sparkles,
  UserRoundSearch,
  UserSearch,
  Laugh,
  HammerIcon,
  FileUserIcon,
} from "lucide-react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import type { RepliesMap } from "@/types/chat";

interface QuickQuestionsProps {
  submitQuery?: (query: string) => void;
  setInput?: (value: string) => void;
  handlePresetReply?: (question: string, reply: string, tool?: string) => void;
  presetReplies: RepliesMap;
}

const baseQuestions: Record<string, string> = {
  Me: "Who are you? I want to know more about you.",
  Projects: "What are your projects? What are you working on right now?",
  Skills: "What are your skills? Give me a list of your soft and hard skills.",
  Resume: "Can I see your resume?",
  Contact:
    'How can I reach you? What kind of project would make you say "yes" immediately?',
};

const quickActions = [
  { key: "Me", color: "#329696", icon: Laugh },
  { key: "Skills", color: "#856ED9", icon: Layers },
  { key: "Projects", color: "#3E9858", icon: HammerIcon },
  { key: "Resume", color: "#D97856", icon: FileUserIcon },
  { key: "Contact", color: "#C19433", icon: UserRoundSearch },
];

const categories = [
  {
    id: "me",
    name: "Me",
    icon: UserSearch,
    questions: [
      "Who are you?",
      "What are your passions?",
      "How did you get started in tech?",
      "Where do you see yourself in 5 years?",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: BriefcaseIcon,
    questions: [
      "Can I see your resume?",
      "What makes you a valuable team member?",
      "Where are you working now?",
      "Why should I hire you?",
      "What's your educational background?",
    ],
  },
  {
    id: "projects",
    name: "Projects",
    icon: CodeIcon,
    questions: ["What projects are you most proud of?"],
  },
  {
    id: "skills",
    name: "Skills",
    icon: GraduationCapIcon,
    questions: [
      "What are your skills?",
      "How was your experience working as freelancer?",
    ],
  },
  {
    id: "contact",
    name: "Contact & Future",
    icon: MailIcon,
    questions: [
      "How can I reach you?",
      "What kind of project would make you say 'yes' immediately?",
      "Where are you located?",
    ],
  },
];

const specialQuestions = [
  "Who are you?",
  "Can I see your resume?",
  "What projects are you most proud of?",
  "What are your skills?",
  "How can I reach you?",
];

const AnimatedChevron = () => (
  <motion.div
    animate={{ y: [0, -4, 0] }}
    transition={{
      duration: 1.5,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    }}
    className="text-primary mb-1.5"
  >
    <ChevronUp size={16} />
  </motion.div>
);

export default function QuickQuestions({
  submitQuery,
  handlePresetReply,
  presetReplies,
}: QuickQuestionsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [open, setOpen] = useState(false);

  const handleActionClick = (key: string) => {
    const mapped: Record<string, string> = {
      Me: "Who are you?",
      Projects: "What projects are you most proud of?",
      Skills: "What are your skills?",
      Resume: "Can I see your resume?",
      Contact: "How can I reach you?",
    };

    const question = baseQuestions[key as keyof typeof baseQuestions];
    const presetKey = mapped[key];

    if (presetKey && presetReplies[presetKey] && handlePresetReply) {
      const preset = presetReplies[presetKey];
      handlePresetReply(presetKey, preset.reply, preset.tool);
    } else {
      submitQuery?.(question);
    }
  };

  const handleDrawerClick = (q: string) => {
    submitQuery?.(q);
    setOpen(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <div className="w-full">
        <div className="mb-2 flex justify-center">
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {isVisible ? (
              <>
                <ChevronDown size={14} /> Hide quick questions
              </>
            ) : (
              <>
                <ChevronUp size={14} /> Show quick questions
              </>
            )}
          </button>
        </div>

        {isVisible && (
          <div className="flex w-full flex-wrap gap-1 md:gap-3 justify-center">
            {quickActions.map(({ key, color, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => handleActionClick(key)}
                variant="outline"
                className="border-border hover:bg-border/30 h-auto min-w-[100px] rounded-xl border bg-white/80 px-4 py-3 shadow-none backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 text-gray-700">
                  <Icon size={18} strokeWidth={2} color={color} />
                  <span className="text-sm font-medium">{key}</span>
                </div>
              </Button>
            ))}

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Drawer.Trigger className="flex items-center justify-center">
                    <motion.div
                      className="flex cursor-pointer items-center rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur-sm hover:bg-border/30 dark:border-neutral-800 dark:bg-neutral-900"
                      whileTap={{ scale: 0.98 }}
                    >
                      <CircleEllipsis className="h-[20px] w-[18px]" />
                    </motion.div>
                  </Drawer.Trigger>
                </TooltipTrigger>
                <TooltipContent>
                  <AnimatedChevron />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-100 mt-24 flex h-[80%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[60%]">
          <div className="flex-1 overflow-y-auto rounded-t-[10px] bg-white p-4">
            <div className="mx-auto max-w-md space-y-8 pb-16">
              {categories.map((c) => (
                <Category
                  key={c.id}
                  name={c.name}
                  Icon={c.icon}
                  questions={c.questions}
                  onClick={handleDrawerClick}
                />
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface CategoryProps {
  name: string;
  Icon: React.ElementType;
  questions: string[];
  onClick: (q: string) => void;
}

function Category({ name, Icon, questions, onClick }: CategoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 px-1">
        <Icon className="h-5 w-5" />
        <Drawer.Title className="text-[22px] font-medium text-gray-900">
          {name}
        </Drawer.Title>
      </div>

      <Separator className="my-4" />

      <div className="space-y-3">
        {questions.map((q) => (
          <Question key={q} text={q} onClick={() => onClick(q)} />
        ))}
      </div>
    </div>
  );
}

function Question({ text, onClick }: { text: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isSpecial = specialQuestions.includes(text);

  return (
    <motion.button
      className={cn(
        "flex w-full items-center justify-between rounded-[10px] px-6 py-4 text-left text-md font-normal focus:outline-none",
        isSpecial ? "bg-black text-white" : "bg-[#F7F8F9]",
      )}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center">
        {isSpecial && <Sparkles className="mr-2 h-4 w-4 text-white" />}
        <span>{text}</span>
      </div>
      <motion.div
        animate={{ x: hovered ? 4 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <ChevronRight
          className={cn("h-5 w-5", isSpecial ? "text-white" : "text-primary")}
        />
      </motion.div>
    </motion.button>
  );
}
