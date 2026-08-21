import { FiCpu } from 'react-icons/fi';
import type { AIMessage, AIMessageBlock, AIMessageGraphDrilldown } from './types';
import ChatSummaryCard from './ChatSummaryCard';
import ChatDownloadActions from './ChatDownloadActions';
import ChatTable from './ChatTable';
import ChartPlaceholder from './ChartPlaceholder';
import GraphVisualization from './GraphVisualization';

type Props = {
  message: AIMessage;
  onGraphDrilldown?: (prompt: string) => void;
};

function renderBlock(block: AIMessageBlock, index: number, onGraphDrilldown?: (prompt: string) => void) {
  switch (block.type) {
    case 'text':
      return (
        <div className="aiTextBlock" key={index}>
          {block.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={`${index}-${paragraphIndex}`}>{paragraph}</p>
          ))}
        </div>
      );
    case 'table':
      return (
        <ChatTable
          key={index}
          title={block.title}
          columns={block.columns}
          rows={block.rows}
        />
      );
    case 'card':
    case 'summary':
      return (
        <ChatSummaryCard
          key={index}
          title={block.title}
          cards={block.cards}
        />
      );
    case 'chart':
      return (
        <ChartPlaceholder key={index} title={block.title} description={block.description} />
      );
    case 'graph':
      return (
        <GraphVisualization
          key={index}
          title={block.payload.title}
          chartType={block.payload.chartType}
          xAxis={block.payload.xAxis}
          yAxis={block.payload.yAxis}
          seriesLabel={block.payload.seriesLabel}
          categories={block.payload.categories}
          values={block.payload.values}
          points={block.payload.points}
          drilldowns={block.payload.drilldowns}
          total={block.payload.total}
          onDrilldown={onGraphDrilldown}
        />
      );
    case 'download':
      return (
        <ChatDownloadActions
          key={index}
          title={block.title}
          items={block.items.map((item) => ({
            label: item.label,
            type: item.type,
          }))}
        />
      );
    default:
      return null;
  }
}

export default function ChatMessage({ message, onGraphDrilldown }: Props) {
  const isUser = message.role === 'user';
  const hasLeadText = Boolean(message.content?.trim());
  const showLeadText = hasLeadText || !message.blocks?.length;

  return (
    <article className={`aiMessageRow ${isUser ? 'isUser' : 'isAssistant'}`}>
      {!isUser ? (
        <div className="aiAvatar" aria-hidden="true">
          <FiCpu />
        </div>
      ) : null}

      <div className={`aiMessageBubble ${isUser ? 'userBubble' : 'assistantBubble'}`}>
        <div className="aiMessageMeta">
          <strong>{isUser ? 'You' : 'SaHo AI'}</strong>
          <time>{message.createdAt}</time>
        </div>
        <div className="aiMessageContent">
          {showLeadText ? <p className="aiMessageLead">{message.content}</p> : null}
          {message.blocks?.map((block, index) => renderBlock(block, index, onGraphDrilldown))}
        </div>
      </div>
    </article>
  );
}
