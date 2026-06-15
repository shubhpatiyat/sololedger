// Import images from assets folder
import supportAgentImg from '@/assets/support-agent.png';
import salesImg from '@/assets/Sales.png';
import onboardingImg from '@/assets/Onboarding.png';
import tutorImg from '@/assets/Tutor.png';
import hrAssistantImg from '@/assets/HrAssistant.png';
import receptionistImg from '@/assets/Receptionist .png';
import eventImg from '@/assets/Event.png';
import productExpertImg from '@/assets/ProductExpert.png';
import feedbackCollectorImg from '@/assets/FeedbackCollector.png';
import customPersonaImg from '@/assets/CustomPersona.png';

// Icon mapping for different categories/types
export const iconMapping = {
  "support_agent": supportAgentImg,
  "Support Agent": supportAgentImg,
  "sales_assistant": salesImg,
  "Sales Assistant": salesImg,
  "onboarding_guide": onboardingImg,
  "Onboarding Guide": onboardingImg,
  "learning_coach": tutorImg,
  "Learning Coach/Tutor": tutorImg,
  "hr_assistant": hrAssistantImg,
  "HR Assistant": hrAssistantImg,
  "receptionist": receptionistImg,
  "Receptionist/Front Desk Agent": receptionistImg,
  "event_assistant": eventImg,
  "Event Assistant": eventImg,
  "product_expert": productExpertImg,
  "Product Expert": productExpertImg,
  "feedback_collector": feedbackCollectorImg,
  "Feedback Collector": feedbackCollectorImg,
  "custom": customPersonaImg,
  "Custom Persona": customPersonaImg,
  "default": supportAgentImg,
};

// Description mapping based on category/type from backend
export const descriptionMapping = {
  "support_agent": "Provides team members with instant answers, insights, and support to help them focus on the technical queries.",
  "Support Agent": "Provides team members with instant answers, insights, and support to help them focus on the technical queries.",
  "sales_assistant": "Helps the sales team by engaging with prospects, answering product-related questions, and supporting lead conversion through quick and accurate responses.",
  "Sales Assistant": "Helps the sales team by engaging with prospects, answering product-related questions, and supporting lead conversion through quick and accurate responses.",
  "onboarding_guide": "Guides new users or employees through the onboarding process by providing step-by-step instructions, clarifying doubts, and ensuring a seamless start.",
  "Onboarding Guide": "Guides new users or employees through the onboarding process by providing step-by-step instructions, clarifying doubts, and ensuring a seamless start.",
  "learning_coach": "Assists learners by explaining concepts, answering questions, sharing resources, and offering personalized guidance to improve understanding.",
  "Learning Coach/Tutor": "Assists learners by explaining concepts, answering questions, sharing resources, and offering personalized guidance to improve understanding.",
  "hr_assistant": "Supports employees and HR teams by handling queries, automating repetitive tasks, and ensuring smooth HR operations.",
  "HR Assistant": "Supports employees and HR teams by handling queries, automating repetitive tasks, and ensuring smooth HR operations.",
  "receptionist": "Manages initial interactions by greeting, assisting, and directing users or visitors to the right resources, ensuring a welcoming and efficient experience.",
  "Receptionist/Front Desk Agent": "Manages initial interactions by greeting, assisting, and directing users or visitors to the right resources, ensuring a welcoming and efficient experience.",
  "event_assistant": "Supports event planning and management by coordinating schedules, sending reminders, handling queries, and ensuring smooth event execution.",
  "Event Assistant": "Supports event planning and management by coordinating schedules, sending reminders, handling queries, and ensuring smooth event execution.",
  "product_expert": "Assists the finance team by addressing queries, clarifying doubts, and providing quick guidance on financial matters.",
  "Product Expert": "Assists the finance team by addressing queries, clarifying doubts, and providing quick guidance on financial matters.",
  "feedback_collector": "Simplifies feedback gathering by prompting users for input, organizing responses, and generating insights to improve processes and experiences.",
  "Feedback Collector": "Simplifies feedback gathering by prompting users for input, organizing responses, and generating insights to improve processes and experiences.",
  "custom": "A customized SoloLedger assistant tailored to project-specific billing, reimbursement, and operations needs.",
  "Custom Persona": "A customized SoloLedger assistant tailored to project-specific billing, reimbursement, and operations needs.",
  "default": "SoloLedger assistant to help with invoices, expenses, reimbursements, and finance workflows.",
};

// Helper function to get icon for a category/type
export const getIconForCategory = (category) => {
  return iconMapping[category] || iconMapping.default;
};

// Helper function to get description for a category/type
export const getDescriptionForCategory = (category) => {
  return descriptionMapping[category] || descriptionMapping.default;
};

// Display name mapping for categories
export const displayNameMapping = {
  "support_agent": "Support Agent",
  "sales_assistant": "Sales Assistant", 
  "onboarding_guide": "Onboarding Guide",
  "learning_coach": "Learning Coach/Tutor",
  "hr_assistant": "HR Assistant",
  "receptionist": "Receptionist/Front Desk Agent",
  "event_assistant": "Event Assistant",
  "product_expert": "Product Expert",
  "feedback_collector": "Feedback Collector",
  "custom": "Custom Persona",
  "default": "SoloLedger Assistant",
};

// Helper function to get display name for a category/type
export const getDisplayNameForCategory = (category) => {
  return displayNameMapping[category] || displayNameMapping.default;
};
