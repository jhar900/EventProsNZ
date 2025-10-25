'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  DollarSign,
  CreditCard,
  Clock,
  Shield,
} from 'lucide-react';

interface PricingFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

interface PricingFAQProps {
  faqs: PricingFAQ[];
}

export function PricingFAQ({ faqs }: PricingFAQProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'pricing', name: 'Pricing', icon: DollarSign },
    { id: 'billing', name: 'Billing', icon: CreditCard },
    { id: 'trial', name: 'Free Trial', icon: Clock },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || HelpCircle;
  };

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case 'pricing':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'billing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-16" data-testid="faq-section">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Frequently Asked <span className="text-primary">Questions</span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions about our pricing and plans
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="faq-search"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No questions found matching your search criteria.
              </p>
            </div>
          ) : (
            filteredFaqs.map(faq => {
              const isExpanded = expandedItems.has(faq.id);
              const CategoryIcon = getCategoryIcon(faq.category);

              return (
                <Card
                  key={faq.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={
                    faq.category === 'billing' &&
                    faq.question.includes('payment methods')
                      ? 'faq-payment-methods'
                      : faq.category === 'pricing' &&
                          faq.question.includes('subscription plan')
                        ? 'faq-subscription-plan'
                        : `faq-${faq.id}`
                  }
                >
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(faq.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {faq.question}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={getCategoryColor(faq.category)}
                        >
                          {faq.category}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Popular Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Questions</CardTitle>
            <CardDescription>
              Most commonly asked questions about our pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Pricing</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Can I change my plan anytime?</li>
                  <li>• Are there any setup fees?</li>
                  <li>• Do you offer discounts for annual billing?</li>
                  <li>• What payment methods do you accept?</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Billing</h4>
                <ul className="space-y-2 text-sm">
                  <li>• When will I be charged?</li>
                  <li>• Can I cancel anytime?</li>
                  <li>• Do you offer refunds?</li>
                  <li>• How do I update my payment method?</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-medium">Still Have Questions?</h3>
          <p className="text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>Contact Support</Button>
            <Button variant="outline">Schedule a Call</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
