import { Info } from 'lucide-react';

interface QuickTipProps {
  title: string;
  content: string;
}

export function QuickTip({ title, content }: QuickTipProps) {
  return (
    <div className="mt-8 p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-green-400 mt-0.5" />
        <div>
          <h4 className="font-mono text-green-400 mb-1">{title}</h4>
          <p className="text-sm text-green-500/70 font-mono">{content}</p>
        </div>
      </div>
    </div>
  );
} 