import { FiBarChart2 } from 'react-icons/fi';

type Props = {
  title: string;
  description: string;
};

export default function ChartPlaceholder({ title, description }: Props) {
  return (
    <section className="aiChartPlaceholder" aria-label={title}>
      <div className="aiBlockTitle">{title}</div>
      <div className="aiChartFrame">
        <div className="aiChartIcon" aria-hidden="true">
          <FiBarChart2 />
        </div>
        <div className="aiChartBars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <p>{description}</p>
    </section>
  );
}
