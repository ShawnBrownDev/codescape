import { Terminal } from 'lucide-react';

interface Instruction {
  id: number;
  text: string;
}

interface InstructionListProps {
  title: string;
  instructions: Instruction[];
}

export function InstructionList({ title, instructions }: InstructionListProps) {
  return (
    <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-mono text-green-400 mb-4 flex items-center">
        <Terminal className="h-5 w-5 mr-2" />
        {title}
      </h3>
      <ul className="space-y-3 text-green-500/70 font-mono">
        {instructions.map((instruction) => (
          <li key={instruction.id} className="flex items-start">
            <span className="h-6 w-6 flex items-center justify-center rounded-full bg-green-900/30 border border-green-500/30 text-green-400 text-sm mr-3 flex-shrink-0">
              {instruction.id}
            </span>
            <span>{instruction.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 