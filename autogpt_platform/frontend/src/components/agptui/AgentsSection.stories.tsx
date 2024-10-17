import type { Meta, StoryObj } from "@storybook/react";
import { AgentsSection } from "./AgentsSection";
import { userEvent, within, expect } from "@storybook/test";

const meta = {
  title: "AGPTUI/AgentsSection",
  component: AgentsSection,
  parameters: {
    layout: {
      center: true,
      fullscreen: true,
      padding: 0,
    },
  },
  tags: ["autodocs"],
  argTypes: {
    sectionTitle: { control: "text" },
    agents: { control: "object" },
    onCardClick: { action: "clicked" },
  },
} satisfies Meta<typeof AgentsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTopAgents = [
  {
    agentName: "SEO Optimizer Pro",
    agentImage:
      "https://framerusercontent.com/images/KCIpxr9f97EGJgpaoqnjKsrOPwI.jpg",
    description:
      "Boost your website's search engine rankings with our advanced AI-powered SEO optimization tool.",
    runs: 50000,
    rating: 4.7,
    avatarSrc: "https://example.com/avatar1.jpg",
  },
  {
    agentName: "Content Writer AI",
    agentImage:
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
    description:
      "Generate high-quality, engaging content for your blog, social media, or marketing campaigns.",
    runs: 75000,
    rating: 4.5,
    avatarSrc: "https://example.com/avatar2.jpg",
  },
  {
    agentName: "Data Analyzer Lite",
    agentImage:
      "https://framerusercontent.com/images/KCIpxr9f97EGJgpaoqnjKsrOPwI.jpg",
    description: "A basic tool for analyzing small to medium-sized datasets.",
    runs: 10000,
    rating: 3.8,
    avatarSrc: "https://example.com/avatar3.jpg",
  },
];

export const Default: Story = {
  args: {
    sectionTitle: "Top Agents",
    agents: mockTopAgents,
    onCardClick: (agentName: string) => console.log(`Clicked on ${agentName}`),
  },
};

export const SingleAgent: Story = {
  args: {
    sectionTitle: "Top Agents",
    agents: [mockTopAgents[0]],
    onCardClick: (agentName: string) => console.log(`Clicked on ${agentName}`),
  },
};

export const NoAgents: Story = {
  args: {
    sectionTitle: "Top Agents",
    agents: [],
    onCardClick: (agentName: string) => console.log(`Clicked on ${agentName}`),
  },
};

export const WithInteraction: Story = {
  args: {
    sectionTitle: "Top Agents",
    agents: mockTopAgents,
    onCardClick: (agentName: string) => console.log(`Clicked on ${agentName}`),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstCard = canvas.getAllByRole("store-card")[0];
    await userEvent.click(firstCard);
    await expect(firstCard).toHaveAttribute("aria-pressed", "true");
  },
};

export const MultiRowAgents: Story = {
  args: {
    sectionTitle: "Top Agents",
    agents: [
      ...mockTopAgents,
      {
        agentName: "Image Recognition AI",
        agentImage:
          "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
        description:
          "Accurately identify and classify objects in images using state-of-the-art machine learning algorithms.",
        runs: 60000,
        rating: 4.6,
        avatarSrc: "https://example.com/avatar4.jpg",
      },
      {
        agentName: "Natural Language Processor",
        agentImage:
          "https://framerusercontent.com/images/KCIpxr9f97EGJgpaoqnjKsrOPwI.jpg",
        description:
          "Analyze and understand human language with advanced NLP techniques.",
        runs: 80000,
        rating: 4.8,
        avatarSrc: "https://example.com/avatar5.jpg",
      },
      {
        agentName: "Sentiment Analyzer",
        agentImage:
          "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
        description:
          "Determine the emotional tone of text data for customer feedback analysis.",
        runs: 45000,
        rating: 4.3,
        avatarSrc: "https://example.com/avatar6.jpg",
      },
      {
        agentName: "Chatbot Builder",
        agentImage:
          "https://framerusercontent.com/images/KCIpxr9f97EGJgpaoqnjKsrOPwI.jpg",
        description:
          "Create intelligent chatbots for customer service and engagement.",
        runs: 55000,
        rating: 4.4,
        avatarSrc: "https://example.com/avatar7.jpg",
      },
      {
        agentName: "Predictive Analytics Tool",
        agentImage:
          "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
        description:
          "Forecast future trends and outcomes based on historical data.",
        runs: 40000,
        rating: 4.2,
        avatarSrc: "https://example.com/avatar8.jpg",
      },
      {
        agentName: "Text-to-Speech Converter",
        agentImage:
          "https://framerusercontent.com/images/KCIpxr9f97EGJgpaoqnjKsrOPwI.jpg",
        description:
          "Convert written text into natural-sounding speech in multiple languages.",
        runs: 35000,
        rating: 4.1,
        avatarSrc: "https://example.com/avatar9.jpg",
      },
    ],
    onCardClick: (agentName: string) => console.log(`Clicked on ${agentName}`),
  },
};

export const HiddenAvatars: Story = {
  args: {
    ...Default.args,
    hideAvatars: true,
    sectionTitle: "Agents with Hidden Avatars",
  },
};