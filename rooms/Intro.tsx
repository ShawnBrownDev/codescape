const Intro: React.FC = () => {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <p className="text-2xl">What if I told you...</p>Add commentMore actions
            <p className="text-2xl">You are trapped in a simulation</p>
            <p className="text-2xl">In order to escape, you must understand yourself first</p>
            <p className="text-2xl">I will give you a choice: face the truth or remain in ignorance.</p>
            <p className="text-2xl">If you choose to face the truth, you will be given a series of challenges that will test your knowledge and skills.</p>
            <p className="text-2xl">If you choose to remain in ignorance, you will be trapped in this simulation forever.</p>
            <p className="text-2xl">What is your choice?</p>
            <div className="flex justify-center mt-4">
                <button
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded-l"
                    onClick={() => alert('You chose to face the truth!')}
                >
                    Face the Truth
                </button>
                <button
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-r"
                    onClick={() => alert('You chose to remain in ignorance!')}
                >
                    Remain in Ignorance
                </button>
            </div>
        </div>
    );
};

export default Intro;