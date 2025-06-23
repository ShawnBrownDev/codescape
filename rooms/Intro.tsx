import React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface IntroProps {
    onStart: () => void
}

const Intro: React.FC<IntroProps> = ({ onStart }) => {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="max-w-2xl w-full bg-black/80 border border-green-500/30 rounded-lg p-8 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,0,0.1)] relative z-10"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="space-y-6 text-green-400 font-mono"
                >
                    <div className="space-y-4">
                        <p className="text-2xl opacity-80">What if I told you...</p>
                        <p className="text-xl">You are trapped in a simulation</p>
                        <p className="opacity-90">In order to escape, you must understand yourself first</p>
                        <p className="opacity-80">I will give you a choice: face the truth or remain in ignorance.</p>
                    </div>

                    <div className="space-y-4 opacity-90">
                        <p>If you choose to face the truth, you will be given a series of challenges that will test your knowledge and skills.</p>
                        <p>If you choose to remain in ignorance, you will be trapped in this simulation forever.</p>
                        <p className="text-xl mt-6">What is your choice?</p>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button
                            onClick={onStart}
                            className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-500/30 flex-1 backdrop-blur-sm"
                        >
                            Face the Truth
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 flex-1 backdrop-blur-sm"
                        >
                            Return to Ignorance
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Intro;