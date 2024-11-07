import * as React from "react";
import Image from "next/image";
import { Button } from "../agptui/Button";
import { IconClose } from "../ui/icons";

interface Agent {
  name: string;
  lastEdited: string;
  imageSrc: string;
}

interface PublishAgentSelectProps {
  agents: Agent[];
  onSelect: (agentName: string) => void;
  onCancel: () => void;
  onNext: () => void;
  onClose: () => void;
  onOpenBuilder: () => void;
}

export const PublishAgentSelect: React.FC<PublishAgentSelectProps> = ({
  agents,
  onSelect,
  onCancel,
  onNext,
  onClose,
  onOpenBuilder,
}) => {
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(agentName);
    onSelect(agentName);
  };

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col rounded-3xl bg-white shadow-lg">
      <div className="relative border-b border-slate-200 p-4 sm:p-6">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            aria-label="Close"
          >
            <IconClose size="default" className="text-neutral-600" />
          </button>
        </div>
        <h2 className="mb-2 text-center font-['Poppins'] text-xl font-semibold leading-loose text-neutral-900 sm:text-2xl">
          Publish Agent
        </h2>
        <p className="text-center font-['Geist'] text-sm font-normal leading-7 text-neutral-600 sm:text-base">
          Select your project that you'd like to publish
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="inline-flex h-[370px] flex-col items-center justify-center gap-[29px] px-4 py-5 sm:px-6">
          <div className="w-full text-center font-['Geist'] text-lg font-normal leading-7 text-neutral-600 sm:w-[573px] sm:text-xl">
            Uh-oh.. It seems like you don't have any agents in your library.
            <br />
            We'd suggest you to create an agent in our builder first
          </div>
          <Button
            onClick={onOpenBuilder}
            variant="default"
            size="lg"
            className="bg-neutral-800 text-white hover:bg-neutral-900"
          >
            Open builder
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-grow overflow-hidden p-4 sm:p-6">
            <h3 className="sr-only">List of agents</h3>
            <div
              className="h-[300px] overflow-y-auto pr-2 sm:h-[400px] md:h-[500px]"
              role="region"
              aria-labelledby="agentListHeading"
            >
              <div id="agentListHeading" className="sr-only">
                Scrollable list of agents
              </div>
              <div className="p-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.name}
                      className={`cursor-pointer overflow-hidden rounded-2xl transition-all ${
                        selectedAgent === agent.name
                          ? "shadow-lg ring-4 ring-violet-600"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => handleAgentClick(agent.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAgentClick(agent.name);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedAgent === agent.name}
                    >
                      <div className="relative h-32 bg-gray-100 sm:h-40">
                        <Image
                          src={agent.imageSrc}
                          alt={agent.name}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-['Geist'] text-sm font-medium leading-normal text-neutral-800 sm:text-base">
                          {agent.name}
                        </h3>
                        <p className="font-['Geist'] text-xs font-normal leading-[14px] text-neutral-500 sm:text-sm">
                          Edited {agent.lastEdited}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4 border-t border-slate-200 p-4 sm:p-6">
            <Button
              onClick={onCancel}
              variant="outline"
              size="default"
              className="w-full sm:flex-1"
            >
              Back
            </Button>
            <Button
              onClick={onNext}
              disabled={!selectedAgent}
              variant="default"
              size="default"
              className="w-full bg-neutral-800 text-white hover:bg-neutral-900 sm:flex-1"
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};