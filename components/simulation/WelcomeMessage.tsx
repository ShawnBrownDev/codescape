interface WelcomeMessageProps {
  title: string;
  subtitle: string;
}

export function WelcomeMessage({ title, subtitle }: WelcomeMessageProps) {
  return (
    <div className="text-center space-y-4 mb-8">
      <h2 className="text-2xl font-mono text-green-400 neon-text">{title}</h2>
      <p className="text-green-500/70 font-mono">{subtitle}</p>
    </div>
  );
} 