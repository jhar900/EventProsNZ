'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Star, CheckCircle, XCircle } from 'lucide-react';
import { useContractors } from '@/hooks/useContractors';

interface Contractor {
  id: string;
  name: string;
  companyName: string;
  description: string;
  location: string;
  avatarUrl?: string;
  averageRating: number;
  reviewCount: number;
  isVerified: boolean;
  serviceCategories: string[];
  subscriptionTier: string;
}

interface ContractorSelectionProps {
  value?: string;
  onChange: (contractorId: string) => void;
  error?: string;
  className?: string;
}

export function ContractorSelection({
  value,
  onChange,
  error,
  className = '',
}: ContractorSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);

  const {
    contractors: allContractors,
    isLoading: contractorsLoading,
    error: contractorsError,
    fetchContractors,
  } = useContractors();

  // Load contractors on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchContractors({
          search: searchTerm,
          category: selectedCategory,
          verified_only: showVerifiedOnly,
        });
      } catch (err) {
        console.error('Failed to load contractors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [searchTerm, selectedCategory, showVerifiedOnly, fetchContractors]);

  // Update contractors list when data changes
  useEffect(() => {
    setContractors(allContractors || []);
  }, [allContractors]);

  // Find selected contractor
  useEffect(() => {
    if (value && contractors.length > 0) {
      const contractor = contractors.find(c => c.id === value);
      setSelectedContractor(contractor || null);
    }
  }, [value, contractors]);

  // Get unique service categories
  const serviceCategories = Array.from(
    new Set(contractors.flatMap(c => c.serviceCategories))
  ).sort();

  // Filter contractors based on search and filters
  const filteredContractors = contractors.filter(contractor => {
    const matchesSearch =
      !searchTerm ||
      contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.serviceCategories.some(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      !selectedCategory ||
      contractor.serviceCategories.includes(selectedCategory);

    const matchesVerified = !showVerifiedOnly || contractor.isVerified;

    return matchesSearch && matchesCategory && matchesVerified;
  });

  const handleContractorSelect = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    onChange(contractor.id);
  };

  const handleClearSelection = () => {
    setSelectedContractor(null);
    onChange('');
  };

  if (contractorsError) {
    return (
      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
        Failed to load contractors: {contractorsError}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contractors by name, company, or services..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showVerifiedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
          >
            {showVerifiedOnly ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Verified Only
          </Button>
        </div>
      </div>

      {/* Selected Contractor */}
      {selectedContractor && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedContractor.avatarUrl} />
                  <AvatarFallback>
                    {selectedContractor.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{selectedContractor.name}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedContractor.companyName}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm ml-1">
                        {selectedContractor.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({selectedContractor.reviewCount} reviews)
                    </span>
                    {selectedContractor.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contractor List */}
      {!selectedContractor && (
        <div className="space-y-4">
          {isLoading || contractorsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">
                Loading contractors...
              </p>
            </div>
          ) : filteredContractors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No contractors found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContractors.map(contractor => (
                <Card
                  key={contractor.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    value === contractor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleContractorSelect(contractor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contractor.avatarUrl} />
                        <AvatarFallback>
                          {contractor.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {contractor.name}
                        </h4>
                        <p className="text-xs text-gray-600 truncate">
                          {contractor.companyName}
                        </p>

                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs ml-1">
                              {contractor.averageRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({contractor.reviewCount})
                          </span>
                          {contractor.isVerified && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              ✓
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center mt-2">
                          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-600 truncate">
                            {contractor.location}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {contractor.serviceCategories
                            .slice(0, 2)
                            .map(category => (
                              <Badge
                                key={category}
                                variant="outline"
                                className="text-xs"
                              >
                                {category}
                              </Badge>
                            ))}
                          {contractor.serviceCategories.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contractor.serviceCategories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
