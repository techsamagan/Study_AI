import React, { useState } from 'react';
import { FileText, Sparkles, Target, Brain, TrendingUp, BookOpen, Folder, MessageSquare, Menu, X, CheckCircle, Zap, LucideIcon } from 'lucide-react';
import { SignUpDialog } from './components/SignUpDialog';
import { SignInDialog } from './components/SignInDialog';

// Type Definitions
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
}

interface NavItem {
  name: string;
  href: string;
}

type DemoState = 'input' | 'processing' | 'result';

// Custom Gradient Button Component
const PrimaryButton: React.FC<ButtonProps> = ({ children, onClick = () => {}, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="relative group overflow-hidden px-8 py-3 text-lg font-semibold text-white transition-all duration-300 ease-out rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
        background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)', // Indigo to Purple
    }}
  >
    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
    <span className="relative z-10">{children}</span>
  </button>
);

// Custom Secondary Button Component
const SecondaryButton: React.FC<ButtonProps> = ({ children, onClick = () => {} }) => (
  <button
    onClick={onClick}
    className="px-6 py-3 text-indigo-600 border border-indigo-200 rounded-full font-semibold transition-colors duration-200 hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    {children}
  </button>
);

// Feature Card Component
const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-transform duration-300 hover:shadow-2xl hover:-translate-y-1">
    <Icon className="w-8 h-8 text-purple-600 mb-4" />
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Testimonial Card Component
const TestimonialCard: React.FC<TestimonialCardProps> = ({ quote, name, title }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-500/80">
    <p className="text-gray-700 italic mb-4">"{quote}"</p>
    <div className="font-semibold text-gray-900">{name}</div>
    <div className="text-sm text-purple-600">{title}</div>
  </div>
);


interface LandingPageProps {
    onLogin?: () => void;
}

const App: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [demoText, setDemoText] = useState<string>('');
    const [demoState, setDemoState] = useState<DemoState>('input');
    const [summaryResult, setSummaryResult] = useState<string>('');
    const [signUpOpen, setSignUpOpen] = useState<boolean>(false);
    const [signInOpen, setSignInOpen] = useState<boolean>(false);

    const handleDemoSubmit = (): void => {
        if (!demoText.trim()) return;
        setDemoState('processing');
        setSummaryResult('');

        // Simulate AI processing time
        setTimeout(() => {
            setDemoState('result');
            // Simulate AI typing effect
            const sampleSummary = "The core concept of effective learning hinges on active recall and spaced repetition. By converting dense text into concise questions and answers (flashcards), the brain is forced to retrieve information rather than passively reread it. This method dramatically increases retention and overall comprehension speed for complex topics. This AI tool automates the tedious extraction process, allowing students to focus purely on studying.";
            let i = 0;
            const typingInterval = setInterval(() => {
                setSummaryResult((prev) => prev + sampleSummary[i]);
                i++;
                if (i === sampleSummary.length) {
                    clearInterval(typingInterval);
                }
            }, 10);
        }, 1000);
    };

    const resetDemo = (): void => {
        setDemoState('input');
        setDemoText('');
        setSummaryResult('');
    };

    const handleSwitchToSignIn = (): void => {
        setSignUpOpen(false);
        setSignInOpen(true);
    };

    const handleSwitchToSignUp = (): void => {
        setSignInOpen(false);
        setSignUpOpen(true);
    };

    const navItems: NavItem[] = [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Testimonials', href: '#testimonials' },
        { name: 'Get Started', href: '#get-started' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 antialiased">
            
            {/* Navigation */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="text-2xl font-extrabold text-indigo-600 flex items-center">
                            <Zap className="w-6 h-6 mr-1" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                StudyAI
                            </span>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            {navItems.map((item) => (
                                <a key={item.name} href={item.href} className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                                    {item.name}
                                </a>
                            ))}
                        </nav>
                        <div className="hidden md:block">
                            <PrimaryButton onClick={() => setSignUpOpen(true)}>
                                Sign Up
                            </PrimaryButton>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:text-indigo-600">
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white shadow-xl pb-4">
                        {navItems.map((item) => (
                            <a 
                                key={item.name} 
                                href={item.href} 
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 transition-colors font-medium"
                            >
                                {item.name}
                            </a>
                        ))}
                        <div className="px-4 pt-2">
                             <PrimaryButton onClick={() => { setSignUpOpen(true); setIsMenuOpen(false); }}>
                                Sign Up
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </header>

            <main>
                
                {/* 1. Hero Section */}
                <section className="relative pt-16 pb-24 md:pt-32 md:pb-40 overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        {/* Headline */}
                        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-4 text-gray-900">
                            Turn Any Document Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Smart Flashcards</span> — Instantly.
                        </h1>
                        {/* Subheadline */}
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
                            Upload your files, get AI summaries, and start mastering topics faster with personalized study tools.
                        </p>
                        
                        {/* CTAs */}
                        <div className="flex justify-center space-x-4 mb-16">
                            <PrimaryButton onClick={() => setSignUpOpen(true)}>
                                Upload Your Notes
                            </PrimaryButton>
                            <SecondaryButton>
                                See How It Works
                            </SecondaryButton>
                        </div>

                        {/* Visual: AI Dashboard Mockup */}
                        <div className="relative w-full max-w-5xl mx-auto mt-12">
                            <div className="relative bg-white p-4 md:p-8 rounded-3xl shadow-2xl border-2 border-indigo-100 transform transition-transform duration-500 hover:scale-[1.01]">
                                {/* Header Bar */}
                                <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 mb-6">
                                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span className="ml-4 text-sm text-gray-500">Dashboard / New Study Set</span>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-8 text-left">
                                    {/* Input Pane */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-500"/>Uploaded File Preview</h3>
                                        <div className="bg-gray-50 p-4 rounded-xl h-64 overflow-y-auto border border-gray-200">
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                                <span className="font-semibold text-indigo-600">Topic: Photosynthesis</span><br/>
                                                Photosynthesis is the process used by plants, algae, and certain bacteria to convert light energy into chemical energy. This chemical energy is stored in carbohydrate molecules, such as sugars, which are synthesized from carbon dioxide and water. In most cases, oxygen is released as a waste product. The process occurs in two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions occur in the thylakoid membranes of the chloroplasts...
                                                <span className="bg-yellow-100 p-1 rounded font-mono">... (2,100 words remaining)</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Output Pane */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center"><Brain className="w-5 h-5 mr-2 text-purple-500"/>AI Generated Assets</h3>
                                        <div className="bg-purple-50 p-6 rounded-xl h-64 border border-purple-200 relative">
                                            <p className="text-lg font-semibold text-purple-800 mb-3">Key Summary:</p>
                                            <p className="text-sm text-gray-700 leading-relaxed">
                                            Photosynthesis transforms light energy into chemical energy (sugars) using CO₂ and H₂O. This occurs in chloroplasts through light-dependent reactions and the Calvin cycle. The overall reaction is essential for nearly all life on Earth.
                                            </p>
                                            <div className="absolute bottom-4 right-6 p-2 bg-purple-200 text-purple-800 rounded-full text-sm font-bold shadow-md">
                                                <Zap className="w-4 h-4 inline-block mr-1"/> 42 Flashcards Generated!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* 2. How It Works */}
                <section id="how-it-works" className="py-20 md:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Master Your Material in 3 Simple Steps</h2>
                        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">The fastest path from reading to remembering. Our AI handles the busy work.</p>

                        <div className="grid md:grid-cols-3 gap-10">
                            
                            {/* Step 1 */}
                            <div className="text-center group p-6">
                                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-indigo-100 transition-colors duration-300 group-hover:bg-indigo-500/10">
                                    <FileText className="w-8 h-8 text-indigo-600" />
                                </div>
                                <span className="block text-sm font-semibold text-indigo-500 mb-2">STEP 1</span>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">Upload Your File</h3>
                                <p className="text-gray-600">Securely upload PDFs, lecture notes, textbooks, or articles in any format.</p>
                            </div>

                            {/* Divider Arrow */}
                            <div className="hidden md:block absolute left-1/3 right-1/3 top-[calc(200px)] h-1 w-1/6 bg-gradient-to-r from-indigo-300 to-purple-300 transform -translate-y-1/2"></div>
                            
                            {/* Step 2 */}
                            <div className="text-center group p-6">
                                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-purple-100 transition-colors duration-300 group-hover:bg-purple-500/10">
                                    <Sparkles className="w-8 h-8 text-purple-600" />
                                </div>
                                <span className="block text-sm font-semibold text-purple-500 mb-2">STEP 2</span>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">AI Summarizes Key Ideas</h3>
                                <p className="text-gray-600">Our model identifies key terms, concepts, and relationships, turning text into structure.</p>
                            </div>
                            
                            {/* Divider Arrow */}
                            <div className="hidden md:block absolute left-2/3 right-0 top-[calc(200px)] h-1 w-1/6 bg-gradient-to-r from-purple-300 to-teal-300 transform -translate-y-1/2"></div>
                            
                            {/* Step 3 */}
                            <div className="text-center group p-6">
                                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-teal-100 transition-colors duration-300 group-hover:bg-teal-500/10">
                                    <Target className="w-8 h-8 text-teal-600" />
                                </div>
                                <span className="block text-sm font-semibold text-teal-500 mb-2">STEP 3</span>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">Generate Flashcards & Quizzes</h3>
                                <p className="text-gray-600">Instantly convert the summaries into interactive, ready-to-use study sets.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Key Features / Value Section */}
                <section id="features" className="py-20 md:py-28 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">The Power of Focused Learning</h2>
                        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">Built for speed, efficiency, and deep subject mastery.</p>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={BookOpen} 
                                title="Summarize Any Document" 
                                description="Condense thousands of words into bullet points and key takeaways, saving hours of reading." 
                            />
                            <FeatureCard 
                                icon={Brain} 
                                title="Generate Flashcards by Topic" 
                                description="Create targeted study sets automatically, based on chapters, sections, or keywords you select." 
                            />
                            <FeatureCard 
                                icon={Folder} 
                                title="Organize Study Sets" 
                                description="Keep your material perfectly structured by course, semester, or exam type with smart folders." 
                            />
                            <FeatureCard 
                                icon={TrendingUp} 
                                title="Track Learning Progress" 
                                description="Visualize your mastery score and identify weak areas for focused revision using our dashboard." 
                            />
                            <FeatureCard 
                                icon={MessageSquare} 
                                title="Personalized Study Tips" 
                                description="Get real-time recommendations from your AI tutor on when and how to review specific cards." 
                            />
                            <FeatureCard 
                                icon={CheckCircle} 
                                title="Export & Share" 
                                description="Download your study sets as PDFs or share them instantly with classmates and colleagues." 
                            />
                        </div>
                    </div>
                </section>
                
                {/* 4. Demo / Interactive Section */}
                <section className="py-20 md:py-28 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Experience The AI Instantly</h2>
                        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-12">See how fast dense text becomes actionable knowledge. Try a quick demo below.</p>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 bg-indigo-50 p-6 rounded-3xl shadow-xl border border-indigo-100">
                            
                            {/* Input Panel */}
                            <div className="p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
                                <h3 className="text-lg font-bold mb-3 text-indigo-700">1. Paste Text Here:</h3>
                                <textarea
                                    value={demoText}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDemoText(e.target.value)}
                                    placeholder="Paste a paragraph from your notes or textbook here to see the magic..."
                                    rows={8}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                                    disabled={demoState !== 'input'}
                                />
                                <div className="flex justify-between items-center mt-4">
                                    <p className="text-xs text-gray-500">{demoText.length} characters</p>
                                    <PrimaryButton 
                                        onClick={handleDemoSubmit} 
                                        disabled={demoState !== 'input' || !demoText.trim()}
                                    >
                                        Summarize & Flashcards
                                    </PrimaryButton>
                                </div>
                            </div>

                            {/* Output Panel */}
                            <div className="p-4 bg-purple-100 rounded-2xl shadow-lg border border-purple-200 relative">
                                <h3 className="text-lg font-bold mb-3 text-purple-700">2. AI Analysis:</h3>
                                
                                {demoState === 'input' && (
                                    <div className="text-center py-10 text-gray-500 italic">
                                        Results will appear here after analysis.
                                    </div>
                                )}
                                
                                {demoState === 'processing' && (
                                    <div className="text-center py-10">
                                        <Sparkles className="w-8 h-8 mx-auto text-purple-500 animate-pulse" />
                                        <p className="mt-3 font-semibold text-purple-700">AI is thinking...</p>
                                    </div>
                                )}

                                {demoState === 'result' && (
                                    <div className="space-y-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <p className="font-semibold text-sm mb-1 text-gray-800">Summary:</p>
                                            <p className="text-xs text-gray-600 whitespace-pre-line">{summaryResult}</p>
                                        </div>
                                        <div className="p-3 bg-purple-200 rounded-lg text-center font-bold text-purple-800 shadow-sm">
                                            <Zap className="w-4 h-4 inline-block mr-1"/> 
                                            6 Flashcards Generated!
                                        </div>
                                        <div className="text-center pt-2">
                                            <SecondaryButton onClick={resetDemo}>
                                                Try Another Demo
                                            </SecondaryButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Social Proof / Testimonials */}
                <section id="testimonials" className="py-20 md:py-28 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Loved by Students and Educators</h2>
                        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">Don't just take our word for it—see how StudyAI changes learning.</p>

                        <div className="grid md:grid-cols-3 gap-8">
                            <TestimonialCard 
                                quote="I cut my study time for biology in half. The flashcard generation is spot-on and perfectly tailored to my complex lecture slides." 
                                name="Sarah J." 
                                title="University Student (Pre-Med)" 
                            />
                            <TestimonialCard 
                                quote="The ability to quickly summarize dense historical documents has been a game-changer for my research paper workflow. Highly recommend." 
                                name="Dr. Alex V." 
                                title="History Professor" 
                            />
                            <TestimonialCard 
                                quote="The personalized tips actually help me focus on the weak points I didn't even realize I had. It feels like having a personal tutor 24/7." 
                                name="Mark T." 
                                title="High School Senior" 
                            />
                        </div>
                    </div>
                </section>

                {/* 6. Call to Action */}
                <section id="get-started" className="py-20 md:py-28 bg-gradient-to-tr from-indigo-50 to-purple-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Start Learning Faster Today</h2>
                        <p className="text-xl text-gray-600 mb-10">
                            Join thousands of learners using AI to summarize documents, build smart flashcards, and stay ahead in their studies. Everything you need to boost your productivity in one place.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <PrimaryButton>Get Started for Free</PrimaryButton>
                            <SecondaryButton>Watch Product Tour</SecondaryButton>
                        </div>
                    </div>
                </section>
            </main>

            {/* 7. Footer */}
            <footer className="bg-gray-900 text-white pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-5 gap-8 border-b border-gray-800 pb-8">
                        
                        <div className="md:col-span-2">
                             <div className="text-2xl font-extrabold text-indigo-400 flex items-center mb-2">
                                <Zap className="w-6 h-6 mr-1" />
                                StudyAI
                            </div>
                            <p className="text-sm text-gray-400">Master topics faster. The future of personalized learning.</p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 text-indigo-400">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#get-started" className="hover:text-white transition-colors">Get Started</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                            </ul>
                        </div>
                        
                        {/* Company */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 text-indigo-400">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4 text-indigo-400">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms & Privacy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} StudyAI, Inc. All rights reserved.</p>
                        {/* Social Links Placeholder */}
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">X</a>
                            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                            <a href="#" className="hover:text-white transition-colors">Discord</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Dialogs */}
            <SignUpDialog 
                open={signUpOpen} 
                onOpenChange={setSignUpOpen}
                onSwitchToSignIn={handleSwitchToSignIn}
                onLogin={onLogin}
            />
            <SignInDialog 
                open={signInOpen} 
                onOpenChange={setSignInOpen}
                onSwitchToSignUp={handleSwitchToSignUp}
                onLogin={onLogin}
            />
        </div>
    );
};

export default App;
