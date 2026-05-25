'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  X,
  Shield,
  CreditCard,
  Sparkles,
  Zap,
  Crown,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingFeature {
  text: string
  included: boolean
}

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  icon: React.ReactNode
  features: PricingFeature[]
  cta: string
  popular?: boolean
}

// ─── Fallback Data ───────────────────────────────────────────────────────────

const FALLBACK_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our platform',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: <Zap className="size-5" />,
    features: [
      { text: '1,000 words/month', included: true },
      { text: '5 images/month', included: true },
      { text: '20 chat messages', included: true },
      { text: '10 code generations', included: true },
      { text: 'Basic templates only', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom chat bots', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started',
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Great for individual creators',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    icon: <Sparkles className="size-5" />,
    features: [
      { text: '50,000 words/month', included: true },
      { text: '50 images/month', included: true },
      { text: '500 chat messages', included: true },
      { text: '100 code generations', included: true },
      { text: 'All templates', included: true },
      { text: 'Priority support', included: false },
      { text: 'Custom chat bots', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Choose Starter',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Best for power users and teams',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    icon: <Crown className="size-5" />,
    popular: true,
    features: [
      { text: '200,000 words/month', included: true },
      { text: '200 images/month', included: true },
      { text: 'Unlimited chat', included: true },
      { text: '500 code generations', included: true },
      { text: 'All templates + Premium', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom chat bots', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'Choose Professional',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For organizations with advanced needs',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    icon: <Building2 className="size-5" />,
    features: [
      { text: 'Unlimited words', included: true },
      { text: 'Unlimited images', included: true },
      { text: 'Unlimited chat', included: true },
      { text: 'Unlimited code generations', included: true },
      { text: 'All templates + Premium', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Team management', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
    cta: 'Contact Sales',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference for the remainder of your billing cycle. When downgrading, the new rate takes effect at the start of your next billing period.',
  },
  {
    question: 'What happens when I reach my limit?',
    answer:
      'You\'ll be notified via email and in-app when you\'re approaching your plan limits. Once you reach a limit, you can either upgrade your plan or wait for your monthly quota to reset. We never cut off service without warning.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes, the Free plan lets you explore our platform with limited usage at no cost. If you want to try premium features, we offer a 14-day free trial on any paid plan—no credit card required to start.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and bank transfers for annual Enterprise plans. All payments are securely processed through Stripe.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Yes, we offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied within the first 14 days, contact our support team for a full refund—no questions asked.',
  },
]

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [plans, setPlans] = useState<PricingPlan[]>(FALLBACK_PLANS)
  const [loading, setLoading] = useState(true)
  const { setActivePage } = useAppStore()

  // ─── Fetch pricing from API ─────────────────────────────────────────────

  useEffect(() => {
    async function fetchPricing() {
      try {
        const response = await fetch('/api/pricing')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()

        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          const apiPlans: PricingPlan[] = data.plans.map(
            (plan: Record<string, unknown>) => {
              const name = String(plan.name || '').toLowerCase()
              let icon = <Zap className="size-5" />
              if (name === 'free') icon = <Zap className="size-5" />
              else if (name === 'starter')
                icon = <Sparkles className="size-5" />
              else if (name === 'professional')
                icon = <Crown className="size-5" />
              else if (name === 'enterprise')
                icon = <Building2 className="size-5" />

              let features: PricingFeature[] = []
              try {
                const raw = plan.features
                if (typeof raw === 'string') {
                  features = JSON.parse(raw)
                } else if (Array.isArray(raw)) {
                  features = raw
                }
              } catch {
                features = []
              }

              return {
                id: plan.id || name,
                name: String(plan.name || ''),
                description:
                  String(plan.description || '') ||
                  FALLBACK_PLANS.find(
                    (f) => f.id === name || f.name.toLowerCase() === name
                  )?.description ||
                  '',
                monthlyPrice: Number(plan.monthlyPrice || 0),
                yearlyPrice: Number(plan.yearlyPrice || 0),
                icon,
                features:
                  features.length > 0
                    ? features
                    : FALLBACK_PLANS.find(
                        (f) => f.id === name || f.name.toLowerCase() === name
                      )?.features || [],
                cta:
                  String(plan.cta || '') ||
                  FALLBACK_PLANS.find(
                    (f) => f.id === name || f.name.toLowerCase() === name
                  )?.cta ||
                  'Get Started',
                popular: Boolean(plan.isPopular || plan.popular),
              }
            }
          )
          setPlans(apiPlans)
        }
      } catch {
        // Use fallback data
        setPlans(FALLBACK_PLANS)
      } finally {
        setLoading(false)
      }
    }

    fetchPricing()
  }, [])

  // ─── Handle plan selection ──────────────────────────────────────────────

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.id === 'free') {
      toast.success('You\'re already on the Free plan!')
      return
    }
    if (plan.id === 'enterprise') {
      toast.info('Our sales team will contact you shortly!')
      return
    }
    toast.success(`Great choice! You've selected the ${plan.name} plan.`)
  }

  // ─── Skeleton loading ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="h-9 w-64 mx-auto bg-muted rounded-lg animate-pulse" />
          <div className="h-5 w-96 mx-auto bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 mx-auto bg-muted rounded-full animate-pulse mt-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[480px] rounded-xl bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-12 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-2">
          <CreditCard className="size-7 text-emerald-500" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Choose Your Plan
          </h1>
        </div>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Select the perfect plan for your content creation needs
        </p>

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Label
            htmlFor="billing-toggle"
            className={`text-sm font-medium cursor-pointer transition-colors ${
              !isYearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-emerald-600"
          />
          <Label
            htmlFor="billing-toggle"
            className={`text-sm font-medium cursor-pointer transition-colors ${
              isYearly ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Yearly
          </Label>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs font-semibold">
            Save ~17%
          </Badge>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
          const isPopular = plan.popular

          return (
            <motion.div key={plan.id} variants={cardVariants}>
              <Card
                className={`relative flex flex-col h-full transition-shadow duration-300 ${
                  isPopular
                    ? 'border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20 dark:ring-emerald-600/20'
                    : 'border-border hover:shadow-md'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-emerald-600 text-white border-0 px-3 py-1 text-xs font-semibold shadow-md">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  {/* Icon */}
                  <div
                    className={`mx-auto size-12 rounded-xl flex items-center justify-center mb-3 ${
                      isPopular
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {plan.icon}
                  </div>

                  <CardTitle className="text-xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sm min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-5">
                  {/* Price */}
                  <div className="text-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isYearly ? 'yearly' : 'monthly'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-baseline justify-center gap-1"
                      >
                        <span className="text-4xl font-bold tracking-tight text-foreground">
                          ${price === 0 ? '0' : price.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${(plan.yearlyPrice / 12).toFixed(2)}/month billed
                        annually
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <X className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? 'text-foreground'
                              : 'text-muted-foreground/50'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-2 pb-6">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full h-11 text-sm font-semibold ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20'
                        : plan.id === 'free'
                          ? 'border-border'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-2">
            Everything you need to know about our pricing
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="px-6">
              {FAQ_ITEMS.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Money-Back Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex items-center justify-center"
      >
        <div className="flex items-center gap-3 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-6 py-3">
          <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            14-Day Money-Back Guarantee
          </span>
          <span className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
            — No questions asked
          </span>
        </div>
      </motion.div>
    </div>
  )
}
