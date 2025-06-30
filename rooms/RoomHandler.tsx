'use client'

import React, { useState, useEffect } from 'react'
import { fetchMatrixChallenge, fetchAvailableChallenges } from '@/lib/supabase'
import { updateUserProgress, initializeUserData } from '@/lib/auth'
import Intro from './Intro'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Timer, Trophy, Code, Terminal, Lightbulb, BookOpen, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/supabase'
import { MatrixBackground } from '@/components/MatrixBackground'
import { supabase } from '@/lib/supabase'
import WinnerScreen from '@/components/simulation/WinnerScreen'
import { useRouter } from 'next/navigation'

type BaseChallenge = Database['public']['Tables']['matrix_challenges']['Row']

type TestCase = {
    input: any;
    expected: any;
    result?: any;
}

interface Challenge extends BaseChallenge {
    required_rank: number;
    content: {
        starter_code: string;
        test_cases: TestCase[];
        hints?: string[];
        example?: string;
    };
}

interface UserRank {
    title: string
    color: string
    level: number
}

interface RoomState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    showWinnerScreen: boolean;
    currentChallenge: Challenge | null;
    availableChallenges: Challenge[];
    allChallenges: Challenge[];
    sessionChallenges: Challenge[]; // Track challenges for this session
    userCode: string;
    showHint: boolean;
    currentHintIndex: number;
    message: string;
    sessionRank: number | null; // Add this line
}

type UserProgress = Database['public']['Tables']['user_progress']['Row']
type Rank = Database['public']['Tables']['ranks']['Row']

// Add type guard function at the top level
function isUserProgress(data: unknown): data is Database['public']['Tables']['user_progress']['Row'] {
    if (!data || typeof data !== 'object') return false;
    const progress = data as any;
    return (
        typeof progress.id === 'number' &&
        typeof progress.user_id === 'string' &&
        Array.isArray(progress.completed_challenges) &&
        progress.completed_challenges.every((x: unknown) => typeof x === 'number') &&
        Array.isArray(progress.unlocked_skills) &&
        progress.unlocked_skills.every((x: unknown) => typeof x === 'string') &&
        typeof progress.total_xp === 'number' &&
        typeof progress.current_rank === 'number' &&
        typeof progress.created_at === 'string' &&
        typeof progress.updated_at === 'string'
    );
}


function TestCaseDetails({ testCases }: { testCases: TestCase[] }) {
    return (
        <div className='mt-6 bg-black/30 p-4 rounded-lg border border-green-500/30 flex flex-col space-y-4'>
            {testCases.map((testCase, index) => (
                <div key={index} className="mb-4 p-4 bg-black/50 rounded-lg border border-green-500/30 flex flex-row justify-between space-y-2">
                    <p><strong>Input:</strong> {JSON.stringify(testCase.input)}</p>
                    <p><strong>Expected:</strong> {JSON.stringify(testCase.expected)}</p>
                    <p><strong>Result:</strong> {JSON.stringify(testCase.result)}</p>
                </div>
            ))}
        </div>
    );
}


function MatrixRoom() {
    const [state, setState] = useState<RoomState>({
        isInitialized: false,
        isLoading: false,
        error: null,
        showWinnerScreen: false,
        currentChallenge: null,
        availableChallenges: [],
        allChallenges: [],
        sessionChallenges: [],
        userCode: '',
        showHint: false,
        currentHintIndex: 0,
        message: '',
        sessionRank: null // Add session rank to track the rank for this session
    })
    const [userRank, setUserRank] = useState<UserRank>({
        title: 'Operator Level 1',
        color: 'text-emerald-400',
        level: 1
    })
    const [progress, setProgress] = useState<{
        completed: number[]
        currentLevel: number
        unlockedSkills: string[]
        totalXP: number
    }>({
        completed: [],
        currentLevel: 1,
        unlockedSkills: ['basic-syntax'],
        totalXP: 0
    })
    const [testedCases, setTestedCases] = useState<Challenge['content']['test_cases']>([])

    const { user, loading: authLoading } = useAuth()
    const { toast } = useToast()
    const router = useRouter()

    // Reset state when user changes
    useEffect(() => {
        if (!user) {
            setState({
                isInitialized: false,
                isLoading: false,
                error: null,
                showWinnerScreen: false,
                currentChallenge: null,
                availableChallenges: [],
                allChallenges: [],
                sessionChallenges: [],
                userCode: '',
                showHint: false,
                currentHintIndex: 0,
                message: '',
                sessionRank: null
            })
            setUserRank({
                title: 'Operator Level 1',
                color: 'text-emerald-400',
                level: 1
            })
            setProgress({
                completed: [],
                currentLevel: 1,
                unlockedSkills: ['basic-syntax'],
                totalXP: 0
            })
        }
    }, [user])

    // Load user's progress and rank first
    useEffect(() => {
        const loadUserProgress = async () => {
            if (!user || authLoading) return;
            
            try {
                setState(prev => ({ ...prev, isLoading: true, showWinnerScreen: false }));
                
                // Initialize user data if needed
                await initializeUserData(user.id);
                
                // Get user progress
                const { data: userProgress, error: progressError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (progressError) {
                    console.error('Error fetching user progress:', progressError);
                    // Use default values if fetch fails
                    setProgress({
                        completed: [],
                        currentLevel: 1,
                        unlockedSkills: ['basic-syntax'],
                        totalXP: 0
                    });
                    return;
                }

                if (userProgress) {
                    // Since this is a direct database query result, we can safely cast it
                    const progress = userProgress as Database['public']['Tables']['user_progress']['Row'];
                    setProgress({
                        completed: progress.completed_challenges,
                        currentLevel: progress.current_rank,
                        unlockedSkills: progress.unlocked_skills,
                        totalXP: progress.total_xp
                    });
                }

                // Get user's rank
                const { data: ranks, error: ranksError } = await supabase
                    .from('ranks')
                    .select('*')
                    .order('level', { ascending: true });

                if (ranksError) {
                    console.error('Error fetching ranks:', ranksError);
                    return;
                }

                if (ranks) {
                    const currentRank = ranks.find(rank => 
                        rank && 
                        typeof rank.min_xp === 'number' && 
                        typeof rank.max_xp === 'number' && 
                        progress.totalXP >= rank.min_xp && 
                        progress.totalXP <= rank.max_xp
                    );
                    
                    if (currentRank) {
                        setUserRank({
                            title: currentRank.title,
                            color: currentRank.color,
                            level: currentRank.level
                        });
                    }
                }

                setState(prev => ({ ...prev, isInitialized: true }));
            } catch (err) {
                console.error('Error loading user progress:', err);
                toast({
                    title: "Error",
                    description: "Failed to load your progress. Please try refreshing the page.",
                    variant: "destructive",
                });
                setState(prev => ({ ...prev, error: "Failed to load user progress. Please try refreshing the page." }));
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };
        
        loadUserProgress();
    }, [user, authLoading, toast, progress.totalXP]);

    // Load all challenges once when component mounts and user progress is initialized
    useEffect(() => {
        const loadAllChallenges = async () => {
            if (!user || !state.isInitialized || state.showWinnerScreen) return;
            
            try {
                setState(prev => ({ ...prev, isLoading: true }));
                
                // Get all challenges
                const { data: challenges, error: challengesError } = await supabase
                    .from('matrix_challenges')
                    .select('*')
                    .order('id', { ascending: true });
                
                if (challengesError) throw challengesError;
                
                if (!challenges?.length) {
                    setState(prev => ({ ...prev, error: 'No challenges available. Please try again later.' }));
                    return;
                }

                // Store the current rank for this session
                const sessionRank = userRank.level;

                // Filter challenges for the session rank only
                const rankChallenges = challenges.filter(challenge => 
                    challenge.required_rank === sessionRank
                );

                // Randomly select 2-5 challenges for this session
                const numChallenges = Math.floor(Math.random() * 4) + 2; // Random number between 2 and 5
                const selectedChallenges = rankChallenges
                    .sort(() => Math.random() - 0.5) // Shuffle array
                    .slice(0, numChallenges);

                setState(prev => ({ 
                    ...prev, 
                    allChallenges: challenges,
                    availableChallenges: selectedChallenges,
                    currentChallenge: selectedChallenges[0],
                    userCode: selectedChallenges[0].content.starter_code,
                    sessionChallenges: [], // Reset completed session challenges
                    sessionRank, // Store the rank for this session
                    isLoading: false,
                    error: null,
                    showWinnerScreen: false
                }));

                setTestedCases(selectedChallenges[0].content.test_cases || []);

        } catch (error) {
                console.error('Error loading challenges:', error);
                setState(prev => ({ 
                    ...prev, 
                    error: 'Failed to load challenges. Please try again.',
                    isLoading: false 
                }));
            }
        };

        loadAllChallenges();
    }, [user, state.isInitialized, userRank.level]);

    const showNextHint = () => {
        if (state.currentChallenge?.content?.hints && state.currentHintIndex < state.currentChallenge.content.hints.length - 1) {
            setState(prev => ({ ...prev, showHint: true, currentHintIndex: prev.currentHintIndex + 1 }));
        }
    }

    const evaluateCode = async (code: string, testCases: Challenge['content']['test_cases']) => {
        if (!testCases?.length) return false;

        const bannedWords = ['eval', 'Function', 'import', 'require', 'console', 'window', 'document', 'XMLHttpRequest', 'fetch', 'supabase'];
        // Check for banned words
        for (const word of bannedWords) {
            if (code.includes(word)) {
                setState(prev => ({ ...prev, error: `Usage of banned word detected: ${word}` }));
                return false;
            }
        }

        try {
            // Extract the function name from the code
            const functionNameMatch = code.match(/function\s+(\w+)/);
            if (!functionNameMatch) {
                console.error('Could not find function name in code');
                setState(prev => ({ ...prev, error: "Could not find function name in code." }));
                return false;
            }
            const functionName = functionNameMatch[1];

            // Create a safe evaluation environment
            const testFunction = new Function('input', `
                try {
                    ${code}
                    // If input is an array, spread it as arguments
                    return Array.isArray(input) ? ${functionName}(...input) : ${functionName}(input);
                } catch (e) {
                    console.error('Test execution error:', e);
                    return null;
                }
            `);

            // Run all test cases
            const tested: TestCase[] = testCases.map(testCase => {
                const result = testFunction(testCase.input);
                return {
                    input: testCase.input,
                    expected: testCase.expected,
                    result: result
                };
            });

            // Store tested cases as state
            setTestedCases(tested);

            for (const testCase of tested) {
                const isEqual = JSON.stringify(testCase.result) === JSON.stringify(testCase.expected);

                if (!isEqual) {
                    console.log('Test failed:', {
                        input: testCase.input,
                        expected: testCase.expected,
                        actual: testCase.result
                    });
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Code evaluation error:', error);
            return false;
        }
    }

    const handleSubmit = async () => {
        if (!state.currentChallenge || !user) return;

        try {
            const isCorrect = await evaluateCode(state.userCode, state.currentChallenge.content.test_cases);
            
            if (isCorrect) {
                // Calculate XP reward with multiplier
                const xpMultiplier = {
                    tutorial: 0.5,
                    practice: 1,
                    challenge: 1.5,
                    boss: 2
                }[state.currentChallenge.type] || 1;
                
                const earnedXP = Math.round(state.currentChallenge.xp_reward * xpMultiplier);

                // Update progress
                const { success, data: newProgress } = await updateUserProgress(
                    user.id,
                    state.currentChallenge.id,
                    state.currentChallenge.requires_skills || [],
                    earnedXP
                );

                if (success && newProgress) {
                    // Ensure all required properties are present and of correct type
                    if (
                        Array.isArray(newProgress.completed_challenges) &&
                        typeof newProgress.current_rank === 'number' &&
                        Array.isArray(newProgress.unlocked_skills) &&
                        typeof newProgress.total_xp === 'number'
                    ) {
                        // Update overall progress
                        setProgress({
                            completed: newProgress.completed_challenges,
                            currentLevel: newProgress.current_rank,
                            unlockedSkills: newProgress.unlocked_skills,
                            totalXP: newProgress.total_xp
                        });

                        // Add current challenge to session completed challenges
                        const updatedSessionChallenges = [...state.sessionChallenges, state.currentChallenge];
                        
                       

                        // Calculate total XP earned in this session
                        const sessionXP = updatedSessionChallenges.reduce(
                            (total, challenge) => total + (challenge.xp_reward || 0), 
                            0
                        );

                        // Check if this was the last challenge
                        if (updatedSessionChallenges.length === state.availableChallenges.length) {
                            
                            // Show different messages based on rank progression
                            const rankUpMessage = newProgress.current_rank > (state.sessionRank ?? 0)
                                ? ` You've reached Operator Level ${newProgress.current_rank}!`
                                : '';

                            toast({
                                title: "Level Complete!",
                                description: `Congratulations! You've earned ${sessionXP} XP in this session!${rankUpMessage}`,
                                variant: "default",
                                className: "bg-green-950 border-green-500 text-green-400",
                            });

                            // Navigate to winner screen with data
                            const params = new URLSearchParams({
                                xp: sessionXP.toString(),
                                challenges: JSON.stringify(updatedSessionChallenges.map(c => c.id)),
                                rankTitle: `Level ${newProgress.current_rank}`,
                                rankColor: 'text-green-400'
                            });
                            
                            router.push(`/winner?${params.toString()}`);
                            return;
                        }

                        // If not the last challenge, move to the next one
                        const nextChallenge = state.availableChallenges[updatedSessionChallenges.length];
                        
                        setState(prev => ({ 
                            ...prev,
                            sessionChallenges: updatedSessionChallenges,
                            currentChallenge: nextChallenge,
                            userCode: nextChallenge.content.starter_code,
                            showHint: false,
                            currentHintIndex: 0,
                            message: '',
                            isLoading: false,
                            error: null
                        }));

                        toast({
                            title: "Success!",
                            description: `You've earned ${earnedXP} XP! Keep going! (${updatedSessionChallenges.length}/${state.availableChallenges.length})`,
                            variant: "default",
                            className: "bg-green-950 border-green-500 text-green-400",
                        });
                    }
                }
            } else {
                setState(prev => ({ ...prev, message: "Not quite right. Try using the hints or reviewing the example." }));
            }
        } catch (err) {
            console.error('Error submitting solution:', err);
            setState(prev => ({ ...prev, message: "An error occurred while evaluating your solution. Please try again." }));
        }
    };

    // If winner screen is showing, return it immediately before any other rendering
    if (state.showWinnerScreen) {
        return (
            <WinnerScreen
                totalXP={progress.totalXP}
                completedChallenges={progress.completed}
                rank={{
                    title: userRank.title,
                    color: userRank.color
                }}
                onContinueTraining={() => {
                    
                    // Reset state completely before loading new challenges
                    setState(prev => ({ 
                        ...prev, 
                        showWinnerScreen: false,
                        isLoading: true,
                        sessionChallenges: [],
                        currentChallenge: null,
                        availableChallenges: [],
                        userCode: '',
                        showHint: false,
                        currentHintIndex: 0,
                        message: ''
                    }));
                    
                    // Get all challenges for the current rank
                    const currentRankChallenges = state.allChallenges.filter(challenge => 
                        challenge.required_rank <= userRank.level
                    );
                    
                    // Randomly select 2-5 challenges
                    const numChallenges = Math.floor(Math.random() * 4) + 2;
                    const selectedChallenges = currentRankChallenges
                        .sort(() => Math.random() - 0.5)
                        .slice(0, numChallenges);
                    
                    // Set new challenges
                    setState(prev => ({ 
                        ...prev, 
                        availableChallenges: selectedChallenges,
                        currentChallenge: selectedChallenges[0],
                        userCode: selectedChallenges[0].content.starter_code,
                        isLoading: false,
                        error: null
                    }));

                    toast({
                        title: "New Training Session",
                        description: "Ready for more challenges? Let's continue your training!",
                        variant: "default",
                        className: "bg-green-950 border-green-500 text-green-400",
                    });
                }}
            />
        );
    }

    if (state.error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
        );
    }

    if (state.isLoading) {
        return (
            <div className="text-center py-8">
                <p className="text-xl text-green-500/70">Loading next challenge...</p>
            </div>
        );
    }

    if (!state.currentChallenge) {
        return (
            <div className="text-center py-8">
                <p className="text-xl text-green-500/70">No challenge found. Please try refreshing the page.</p>
            </div>
        );
    }

    // Main challenge UI
    return (
        <div className="relative z-10">
            <div className="max-w-4xl mx-auto bg-black/80 border border-green-500/30 rounded-lg p-8 backdrop-blur-sm shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                <div className="space-y-6 text-green-400">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold flex items-center gap-2">
                                {state.currentChallenge.type === 'tutorial' && <BookOpen className="h-6 w-6" />}
                                {state.currentChallenge.type === 'practice' && <Code className="h-6 w-6" />}
                                {state.currentChallenge.type === 'challenge' && <Zap className="h-6 w-6" />}
                                {state.currentChallenge.type === 'boss' && <Terminal className="h-6 w-6" />}
                                {state.currentChallenge.title}
                            </h2>
                            <div className="flex items-center text-green-500/70">
                                <Trophy className="h-4 w-4 mr-1" />
                                {state.currentChallenge.xp_reward} XP
                            </div>
                        </div>

                        <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                            <h3 className="text-lg font-semibold mb-2">Mission Briefing</h3>
                            <p className="text-green-400/90">{state.currentChallenge.description}</p>
                        </div>

                        {state.currentChallenge.content.example && (
                            <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
                                <h3 className="text-lg font-semibold mb-2">Example</h3>
                                <pre className="font-mono text-sm">{state.currentChallenge.content.example}</pre>
                            </div>
                        )}

                        <div>
                            <Textarea
                                value={state.userCode}
                                onChange={(e) => setState(prev => ({ ...prev, userCode: e.target.value }))}
                                className="font-mono h-48 bg-black/50 border-green-500/30 text-green-400 placeholder:text-green-500/50"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                onClick={handleSubmit}
                                className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border-green-500/30"
                            >
                                Run Code
                            </Button>
                            <Button
                                onClick={showNextHint}
                                variant="outline"
                                className="border-green-500/30 text-green-400 hover:bg-green-900/20"
                                disabled={!state.currentChallenge.content.hints || state.currentHintIndex >= state.currentChallenge.content.hints.length - 1}
                            >
                                <Lightbulb className="h-4 w-4 mr-2" />
                                {state.currentHintIndex === 0 ? 'Get Hint' : 'Next Hint'}
                            </Button>
                        </div>

                        {state.showHint && state.currentChallenge.content.hints && state.currentChallenge.content.hints[state.currentHintIndex] && (
                            <Alert className="bg-green-900/20 border-green-500/30">
                                <AlertDescription className="text-green-400">
                                    {state.currentChallenge.content.hints[state.currentHintIndex]}
                                </AlertDescription>
                            </Alert>
                        )}

                        {state.message && (
                            <Alert className={`border-green-500/30 ${state.message.includes('Success') ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                <AlertDescription className={state.message.includes('Success') ? 'text-green-400' : 'text-red-400'}>
                                    {state.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        <TestCaseDetails testCases={testedCases} />
                    </div>
                </div>
            </div>
        </div>
    );
}

const RoomHandler: React.FC = () => {
    const [hasStarted, setHasStarted] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { loading: authLoading } = useAuth()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || authLoading) {
        return null
    }

    return (
        <div className="min-h-screen relative">
            <MatrixBackground />
            <div className="relative z-10">
                {!hasStarted ? (
                    <Intro onStart={() => setHasStarted(true)} />
                ) : (
                    <div className="container mx-auto px-4 py-8">
                        <MatrixRoom />
                    </div>
                )}
            </div>
        </div>
    )
}

export default RoomHandler