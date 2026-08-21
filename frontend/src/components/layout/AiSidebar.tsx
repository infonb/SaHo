import AIAssistantDrawer from './ai-assistant/AIAssistantDrawer';

type AiSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function AiSidebar({ open, onClose }: AiSidebarProps) {
  return <AIAssistantDrawer open={open} onClose={onClose} />;
}
