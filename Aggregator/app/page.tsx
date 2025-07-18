"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Star,
  ChevronDown,
  Menu,
  X,
  Twitter,
  Github,
  MessageCircle,
  LogIn,
  UserPlus,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe } from "@/components/magicui/globe"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import { AnimatedBeam } from "@/components/magicui/animated-beam"
import { MacbookScroll } from "@/components/ui/macbook-scroll"
import { PinContainer } from "@/components/ui/3d-pin"
import { HoverEffect, Card as HoverCard, CardTitle, CardDescription } from "@/components/ui/card-hover-effect"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { LampContainer } from "@/components/ui/lamp"
import { motion } from "motion/react"
import { LoginModal } from "@/components/auth/login-modal"
import { SignupModal } from "@/components/auth/signup-modal"
import { WalletSelector } from "@/components/wallet/wallet-selector"
import Link from "next/link"
import { ChatButton } from "@/components/chat/chat-button"
import { usePetra } from "@/components/wallet/petra-context"

interface LandingPageUser {
  id: string
  name: string
  email: string
  image: string
}

export default function LandingPage() {
  const { connected, address } = usePetra()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [user, setUser] = useState<LandingPageUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    stats: false,
    team: false,
    cta: false,
  })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            setIsVisible((prev) => ({ ...prev, [id]: true }))
          }
        })
      },
      { threshold: 0.1 },
    )

    const refs = [heroRef, featuresRef, statsRef, teamRef, ctaRef]
    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [])

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const scrollToSwap = () => {
    window.location.href = "/swap"
  }

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Execute swaps in milliseconds with optimized routing across multiple DEXs",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Trustless",
      description: "Built on Aptos blockchain with audited smart contracts for maximum security",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Best Rates",
      description: "Always get the best prices by comparing rates across Liquidswap and Econia",
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Low Fees",
      description: "Minimal fees with transparent pricing and no hidden costs",
    },
  ]

  const hoverFeatures = [
    {
      title: "Lightning Fast",
      description: "Execute swaps in milliseconds with optimized routing across multiple DEXs. Our advanced algorithms ensure the fastest possible execution times.",
      link: "#",
    },
    {
      title: "Secure & Trustless",
      description: "Built on Aptos blockchain with audited smart contracts for maximum security. Your funds are always under your control.",
      link: "#",
    },
    {
      title: "Best Rates",
      description: "Always get the best prices by comparing rates across Liquidswap and Econia. Our aggregation engine finds optimal trading paths.",
      link: "#",
    },
    {
      title: "Low Fees",
      description: "Minimal fees with transparent pricing and no hidden costs. Save more with our optimized fee structure.",
      link: "#",
    },
  ]

  const stats = [
    { label: "Total Volume", value: "$2.4B+", icon: <BarChart3 className="w-6 h-6" /> },
    { label: "Active Users", value: "150K+", icon: <Users className="w-6 h-6" /> },
    { label: "Transactions", value: "5M+", icon: <Zap className="w-6 h-6" /> },
    { label: "Saved in Fees", value: "$12M+", icon: <DollarSign className="w-6 h-6" /> },
  ]

  const team = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      image: "/placeholder.svg?height=120&width=120",
      description: "Former Aptos Labs engineer with 8+ years in DeFi",
    },
    {
      name: "Sarah Kim",
      role: "CTO",
      image: "/placeholder.svg?height=120&width=120",
      description: "Smart contract expert and blockchain security specialist",
    },
    {
      name: "Mike Johnson",
      role: "Head of Product",
      image: "/placeholder.svg?height=120&width=120",
      description: "UX designer focused on making DeFi accessible to everyone",
    },
  ]

  const testimonials = [
    {
      quote:
        "AptosSwap has completely transformed my trading experience. The lightning-fast execution and best rates across multiple DEXs have saved me thousands in fees. It's like having a professional trading desk in my pocket.",
      name: "Sarah Chen",
      title: "Professional Trader",
    },
    {
      quote:
        "As someone new to DeFi, I was worried about complexity and security. AptosSwap made it incredibly simple while maintaining enterprise-grade security. The UI is intuitive and the support team is amazing.",
      name: "Michael Rodriguez",
      title: "DeFi Newcomer",
    },
    {
      quote: "The best rates I've found across any DEX aggregator. The Aptos blockchain speed combined with their smart routing algorithm gives me an edge in every trade.",
      name: "David Kim",
      title: "Crypto Investor",
    },
    {
      quote:
        "I've been trading on multiple platforms for years, but AptosSwap's execution speed and liquidity aggregation is unmatched. The fact that it's built on Aptos gives me confidence in its scalability and security.",
      name: "Lisa Thompson",
      title: "Institutional Trader",
    },
    {
      quote:
        "The cross-chain functionality and real-time price comparison features are game-changers. I can now execute complex trading strategies across multiple DEXs with a single click. This is the future of DeFi trading.",
      name: "James Wilson",
      title: "DeFi Developer",
    },
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/dexonic_gold.svg" alt="Dexonic Logo" className="h-10 w-10 mr-3 inline-block align-middle" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Dexonic Dex Aggregator</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-yellow-400 transition-colors">
                Features
              </a>
              <a href="#stats" className="text-gray-300 hover:text-yellow-400 transition-colors">
                Stats
              </a>
              <a href="#team" className="text-gray-300 hover:text-yellow-400 transition-colors">
                Team
              </a>

              {/* Auth Buttons */}
              {!user ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 transition-all duration-300 bg-transparent"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button
                    onClick={() => setShowSignupModal(true)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <img src={user.image || "/placeholder.svg"} alt={user.name} className="w-6 h-6 rounded-full" />
                    <span className="text-yellow-400 font-medium">{user.name}</span>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:border-gray-500 bg-transparent"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Petra Wallet */}
              <WalletSelector size="sm" />

              <Button
                onClick={scrollToSwap}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-300"
              >
                Launch App
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-yellow-400">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-yellow-400 transition-colors">
                Features
              </a>
              <a href="#stats" className="block text-gray-300 hover:text-yellow-400 transition-colors">
                Stats
              </a>
              <a href="#team" className="block text-gray-300 hover:text-yellow-400 transition-colors">
                Team
              </a>

              {/* Mobile Auth Buttons */}
              {!user ? (
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login with Google
                  </Button>
                  <Button
                    onClick={() => setShowSignupModal(true)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up with Google
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <img src={user.image || "/placeholder.svg"} alt={user.name} className="w-6 h-6 rounded-full" />
                    <span className="text-yellow-400 font-medium">{user.name}</span>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-400 hover:bg-gray-800 bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}

              {/* Mobile Petra Wallet */}
              <WalletSelector className="w-full" />

              <Button
                onClick={scrollToSwap}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-6 py-2 rounded-lg"
              >
                Launch App
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Globe */}
      <section ref={heroRef} id="hero" className="relative h-screen w-full overflow-hidden">
        {/* Globe Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Globe className="opacity-70 scale-125" />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full px-4 md:px-10 py-4">
          <div
            className={`transition-all duration-1000 text-center ${isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Badge className="mb-6 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 transition-all duration-300">
              <Star className="w-4 h-4 mr-2" />
              Now Live on Aptos Mainnet
            </Badge>

            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
              The Future of
              <br />
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                DeFi Trading
              </span>
            </h1>

            <div className="mb-8 max-w-3xl mx-auto">
              <TextGenerateEffect
                words="Experience lightning-fast swaps with the best rates across multiple DEXs on Aptos. Trade smarter, not harder."
                className="text-xl md:text-2xl text-white leading-relaxed"
                duration={0.8}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={scrollToSwap}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                Start Trading
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 px-8 py-4 rounded-xl text-lg backdrop-blur-sm bg-black/20 transition-all duration-300"
              >
                View Documentation
              </Button>
            </div>

            {/* Wallet Connection Status */}
            {connected && address && (
              <div className="max-w-md mx-auto mb-8">
                <Card className="bg-green-500/10 backdrop-blur-md border border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium">Petra Wallet Connected</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {address.slice(0, 10)}...{address.slice(-6)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-8 h-8 text-yellow-400/60" />
          </div>
        </div>
      </section>

      {/* Features Section with Animated Beams */}
      <section ref={featuresRef} id="features" className="relative z-10 py-20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative">
          {/* Animated Beams Container */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedBeam
              containerRef={featuresRef}
              fromRef={featuresRef}
              toRef={statsRef}
              curvature={80}
              pathColor="#fbbf24"
              pathWidth={3}
              pathOpacity={0.4}
              gradientStartColor="#fbbf24"
              gradientStopColor="#f59e0b"
              duration={8}
              delay={0.5}
              startXOffset={20}
              endXOffset={-20}
            />
            <AnimatedBeam
              containerRef={featuresRef}
              fromRef={featuresRef}
              toRef={statsRef}
              curvature={60}
              pathColor="#f59e0b"
              pathWidth={1}
              pathOpacity={0.2}
              gradientStartColor="#f59e0b"
              gradientStopColor="#d97706"
              duration={12}
              delay={2}
              startXOffset={-15}
              endXOffset={15}
            />
          </div>

          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-5xl font-bold text-white mb-6">Why Choose Dexonic Dex Aggregator?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Built for traders who demand the best rates, fastest execution, and maximum security
            </p>
          </div>

          {/* Interactive Features Cards */}
          <div className={`transition-all duration-1000 ${isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <HoverEffect 
              items={hoverFeatures} 
              className="max-w-6xl mx-auto"
            />
          </div>

          {/* Feature Icons Overlay */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mt-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex justify-center"
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center text-black shadow-lg">
                  {feature.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Beams */}
      <section ref={statsRef} id="stats" className="relative z-10 py-20">
        <div className="container mx-auto px-4 relative">
          {/* Animated Beams Container */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedBeam
              containerRef={statsRef}
              fromRef={statsRef}
              toRef={teamRef}
              curvature={-60}
              pathColor="#f59e0b"
              pathWidth={3}
              pathOpacity={0.4}
              gradientStartColor="#f59e0b"
              gradientStopColor="#d97706"
              duration={7}
              delay={1}
              startXOffset={-25}
              endXOffset={25}
            />
            <AnimatedBeam
              containerRef={statsRef}
              fromRef={statsRef}
              toRef={teamRef}
              curvature={-40}
              pathColor="#d97706"
              pathWidth={1.5}
              pathOpacity={0.3}
              gradientStartColor="#d97706"
              gradientStopColor="#92400e"
              duration={10}
              delay={3}
              startXOffset={20}
              endXOffset={-20}
            />
          </div>

          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible.stats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-5xl font-bold text-white mb-6">Trusted by Thousands</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join the growing community of traders who trust Dexonic Dex Aggregator for their DeFi needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 ${isVisible.stats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="bg-black/50 backdrop-blur-md border border-yellow-500/20 hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-black">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-gray-300">{stat.label}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section with Animated Beams */}
      <section ref={teamRef} id="team" className="relative z-10 py-20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative">
          {/* Animated Beams Container */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedBeam
              containerRef={teamRef}
              fromRef={teamRef}
              toRef={ctaRef}
              curvature={70}
              pathColor="#d97706"
              pathWidth={3}
              pathOpacity={0.4}
              gradientStartColor="#d97706"
              gradientStopColor="#92400e"
              duration={9}
              delay={0.8}
              startXOffset={15}
              endXOffset={-15}
            />
            <AnimatedBeam
              containerRef={teamRef}
              fromRef={teamRef}
              toRef={ctaRef}
              curvature={50}
              pathColor="#92400e"
              pathWidth={1.5}
              pathOpacity={0.25}
              gradientStartColor="#92400e"
              gradientStopColor="#78350f"
              duration={15}
              delay={4}
              startXOffset={-30}
              endXOffset={30}
            />
          </div>

          <div
            className={`text-center mb-16 transition-all duration-1000 ${isVisible.team ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-5xl font-bold text-white mb-6">Meet the Team</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experienced builders from top blockchain companies working to revolutionize DeFi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <div
                key={index}
                className={`transition-all duration-1000 ${isVisible.team ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <PinContainer
                  title={`View ${member.name}'s Profile`}
                  href="#"
                  containerClassName="w-full h-full"
                >
                  <div className="flex flex-col items-center text-center space-y-4 p-6">
                    <div className="relative">
                      <img
                        src={member.image || "/placeholder.svg"}
                        alt={member.name}
                        className="w-24 h-24 rounded-full border-4 border-yellow-500/20 object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-black" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">{member.name}</h3>
                      <p className="text-yellow-400 font-semibold text-sm">{member.role}</p>
                      <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
                        {member.description}
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                        <Twitter className="w-4 h-4 text-black" />
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                        <Github className="w-4 h-4 text-black" />
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-black" />
                      </div>
                    </div>

                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-2">
                      <Zap className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  </div>
                </PinContainer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">What Our Users Say</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied traders who trust Dexonic Dex Aggregator for their DeFi needs
            </p>
          </div>
          
          <div className="h-[40rem] rounded-md flex flex-col antialiased bg-black/20 backdrop-blur-sm items-center justify-center relative overflow-hidden border border-yellow-500/20">
            <InfiniteMovingCards
              items={testimonials}
              direction="left"
              speed="slow"
            />
          </div>
        </div>
      </section>

      {/* Trading Interface Showcase */}
      <section className="relative z-10 py-20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <LampContainer className="mb-16">
            <motion.h2
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="mt-8 bg-gradient-to-br from-yellow-300 to-yellow-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-6xl"
            >
              Experience the Future
            </motion.h2>
          </LampContainer>
          
          <div className="text-center mb-16">
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              See our intuitive trading interface in action - designed for both beginners and professionals
            </p>
          </div>
          
          <div className="flex justify-center">
            <MacbookScroll
              src="/swap-interface-preview.jpg"
              title="Professional Trading Interface"
              badge={
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Live Demo
                </Badge>
              }
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} id="cta" className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div
            className={`transition-all duration-1000 ${isVisible.cta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-5xl font-bold text-white mb-6">Ready to Start Trading?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of traders who are already experiencing the future of DeFi on Aptos
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={scrollToSwap}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg"
              >
                Launch Dexonic Dex Aggregator
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 px-8 py-4 rounded-xl text-lg backdrop-blur-sm bg-transparent transition-all duration-300"
              >
                Join Community
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <MessageCircle className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">FAQs</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to know about Dexonic Dex Aggregator and DeFi trading
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ Item 1 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-yellow-400" />
                  Is Dexonic Dex Aggregator safe to use?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 1 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 1 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    Yes, Dexonic Dex Aggregator is built with security as a top priority. Our smart contracts are audited by leading security firms, 
                    and we use industry-standard security practices. All transactions are executed on the Aptos blockchain, 
                    which provides enterprise-grade security and reliability.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Zap className="w-5 h-5 mr-3 text-yellow-400" />
                  How does Dexonic Dex Aggregator find the best rates?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 2 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 2 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    Dexonic Dex Aggregator aggregates liquidity from multiple DEXs including Liquidswap and Econia. Our advanced routing algorithm 
                    automatically finds the best trading path to ensure you get the most favorable rates and lowest fees. 
                    We compare prices across all available pools in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-yellow-400" />
                  What are the trading fees?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 3 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 3 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    Dexonic Dex Aggregator charges a minimal 0.1% fee on all trades, which is among the lowest in the industry. 
                    There are no hidden fees, and all costs are transparently displayed before you confirm any transaction. 
                    We also help you save on gas fees by optimizing transaction routing.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Users className="w-5 h-5 mr-3 text-yellow-400" />
                  Do I need to create an account?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 4 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 4 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    No account creation is required! Dexonic Dex Aggregator is a non-custodial platform, meaning you maintain full control 
                    of your funds. Simply connect your Petra wallet and start trading immediately. Your private keys never leave your device.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 5 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 5 ? null : 5)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3 text-yellow-400" />
                  Which tokens can I trade?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 5 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 5 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    Dexonic Dex Aggregator supports all major tokens on the Aptos blockchain, including APT, USDC, USDT, and hundreds of other tokens. 
                    We continuously add new tokens as they become available. You can view the complete list of supported tokens 
                    in our token directory.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 6 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 6 ? null : 6)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-3 text-yellow-400" />
                  How fast are transactions processed?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 6 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 6 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    Thanks to Aptos's high-performance blockchain, transactions are typically confirmed within 1-2 seconds. 
                    Our optimized smart contracts and efficient routing ensure that your trades execute quickly and reliably, 
                    even during periods of high network activity.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 7 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 7 ? null : 7)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-yellow-400" />
                  What happens if a transaction fails?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 7 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 7 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    If a transaction fails due to network issues or insufficient funds, you will only pay the gas fee for the failed transaction. 
                    Your original tokens remain untouched. We provide detailed error messages to help you understand what went wrong 
                    and how to resolve it.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 8 */}
            <div className="bg-black/50 backdrop-blur-md border border-yellow-500/20 rounded-xl overflow-hidden hover:bg-black/70 hover:border-yellow-500/40 transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 8 ? null : 8)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-black/30 transition-colors duration-200"
              >
                <h3 className="text-lg font-bold text-white flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3 text-yellow-400" />
                  How can I get support?
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                    openFAQ === 8 ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              {openFAQ === 8 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-300 leading-relaxed">
                    We offer 24/7 support through multiple channels. You can reach us via our Discord community, 
                    email support, or through our in-app chat feature. Our team of DeFi experts is always ready to help 
                    with any questions or issues you may encounter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">
              Still have questions? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 px-6 py-3 rounded-xl backdrop-blur-sm bg-transparent transition-all duration-300"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 px-6 py-3 rounded-xl backdrop-blur-sm bg-transparent transition-all duration-300"
              >
                <Github className="w-4 h-4 mr-2" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/60 backdrop-blur-md border-t border-yellow-500/20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent font-bold text-xl mb-4 md:mb-0">
              Dexonic Dex Aggregator
            </div>
            <div className="text-gray-400 text-sm">© 2024 Dexonic Dex Aggregator. Built on Aptos blockchain.</div>
          </div>
        </div>
      </footer>

      {/* Chat Button - Only visible when user is logged in */}
      <ChatButton user={user} />

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />
    </div>
  )
}
