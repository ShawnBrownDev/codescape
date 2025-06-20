interface IntroProps {
    onStart: () => void
}

const Intro: React.FC<IntroProps> = ({ onStart }) => {
    return (
        <div className="space-y-8 text-green-400">
            <div className="space-y-4">
                <p className="text-2xl font-mono">What if I told you...</p>
                <p className="text-2xl font-mono">You are trapped in a simulation</p>
                <p className="text-2xl font-mono">In order to escape, you must understand yourself first</p>
                <p className="text-2xl font-mono">I will give you a choice: face the truth or remain in ignorance.</p>
                <p className="text-2xl font-mono">If you choose to face the truth, you will be given a series of challenges that will test your knowledge and skills.</p>
                <p className="text-2xl font-mono">If you choose to remain in ignorance, you will be trapped in this simulation forever.</p>
                <p className="text-2xl font-mono">What is your choice?</p>
            </div>
            
            <div className="flex justify-center space-x-4">
                <button
                    className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/30 font-bold py-3 px-6 rounded transition-all duration-300"
                    onClick={onStart}
                >
                    Face the Truth
                </button>
                <button
                    className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 font-bold py-3 px-6 rounded transition-all duration-300"
                    onClick={() => window.history.back()}
                >
                    Return to Ignorance
                </button>
            </div>
        </div>
    );
};

export default Intro;