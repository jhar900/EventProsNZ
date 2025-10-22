'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
} from 'lucide-react';
import {
  INTERNAL_JOB_CATEGORIES,
  EXPERIENCE_LEVELS,
  WORK_ARRANGEMENTS,
} from '@/types/jobs';

interface JobTypeSelectorProps {
  selectedCategory?: string;
  onCategorySelect: (category: string) => void;
  className?: string;
}

interface JobTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  experience: string;
  workArrangement: string;
  paymentTerms: string;
  icon: React.ReactNode;
  color: string;
}

const jobTemplates: JobTemplate[] = [
  {
    id: 'casual_photographer',
    title: 'Casual Wedding Photographer',
    description: 'Perfect for photographers looking for flexible wedding work',
    category: 'casual_work',
    skills: ['Photography', 'Adobe Lightroom', 'Wedding Experience'],
    experience: 'intermediate',
    workArrangement: 'onsite',
    paymentTerms: '$50-80/hour or $500-800 per wedding',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'subcontract_catering',
    title: 'Subcontract Catering Services',
    description: 'Looking for experienced catering teams for large events',
    category: 'subcontracting',
    skills: ['Catering', 'Food Safety', 'Event Management'],
    experience: 'senior',
    workArrangement: 'onsite',
    paymentTerms: 'Project-based: $2000-5000 per event',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'partnership_venue',
    title: 'Venue Partnership Opportunity',
    description: 'Seeking venue partners for exclusive event collaborations',
    category: 'partnerships',
    skills: ['Venue Management', 'Event Planning', 'Business Development'],
    experience: 'expert',
    workArrangement: 'hybrid',
    paymentTerms: 'Revenue sharing: 15-25% commission',
    icon: <Building className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'casual_music',
    title: 'Casual Musician/DJ',
    description: 'Flexible music services for various events',
    category: 'casual_work',
    skills: ['Music Performance', 'DJ Skills', 'Sound Equipment'],
    experience: 'intermediate',
    workArrangement: 'onsite',
    paymentTerms: '$100-200 per event',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'subcontract_decorations',
    title: 'Subcontract Decoration Services',
    description: 'Experienced decoration teams for themed events',
    category: 'subcontracting',
    skills: ['Event Decorating', 'Floral Design', 'Setup/Teardown'],
    experience: 'senior',
    workArrangement: 'onsite',
    paymentTerms: '$1500-3000 per event',
    icon: <Briefcase className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'partnership_planning',
    title: 'Event Planning Partnership',
    description: 'Long-term partnership for comprehensive event planning',
    category: 'partnerships',
    skills: ['Event Planning', 'Vendor Management', 'Client Relations'],
    experience: 'expert',
    workArrangement: 'hybrid',
    paymentTerms: 'Monthly retainer: $2000-5000',
    icon: <Building className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
  },
];

export function JobTypeSelector({
  selectedCategory,
  onCategorySelect,
  className = '',
}: JobTypeSelectorProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'casual_work':
        return <Users className="h-4 w-4" />;
      case 'subcontracting':
        return <Briefcase className="h-4 w-4" />;
      case 'partnerships':
        return <Building className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'casual_work':
        return 'bg-blue-100 text-blue-800';
      case 'subcontracting':
        return 'bg-green-100 text-green-800';
      case 'partnerships':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkArrangementIcon = (arrangement: string) => {
    switch (arrangement) {
      case 'remote':
        return '🏠';
      case 'onsite':
        return '🏢';
      case 'hybrid':
        return '🔄';
      default:
        return '🏢';
    }
  };

  const filteredTemplates = selectedCategory
    ? jobTemplates.filter(template => template.category === selectedCategory)
    : jobTemplates;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Select Job Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(INTERNAL_JOB_CATEGORIES).map(([key, value]) => (
              <Button
                key={key}
                variant={selectedCategory === value ? 'default' : 'outline'}
                onClick={() => onCategorySelect(value)}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  selectedCategory === value
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : ''
                }`}
              >
                {getCategoryIcon(value)}
                <span className="font-medium">
                  {value.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-xs text-center">
                  {value === 'casual_work' && 'Flexible, short-term work'}
                  {value === 'subcontracting' && 'Project-based partnerships'}
                  {value === 'partnerships' && 'Long-term collaborations'}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Job Templates
            {selectedCategory && (
              <Badge className={getCategoryColor(selectedCategory)}>
                {getCategoryIcon(selectedCategory)}
                <span className="ml-1">
                  {selectedCategory.replace('_', ' ').toUpperCase()}
                </span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={template.color}>{template.icon}</div>
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {template.title}
                        </h3>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {template.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Skills */}
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-700">
                        Required Skills:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {template.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {template.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        Experience:
                      </span>
                      <Badge
                        className={getExperienceColor(template.experience)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {template.experience.charAt(0).toUpperCase() +
                          template.experience.slice(1)}
                      </Badge>
                    </div>

                    {/* Work Arrangement */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        Work Type:
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getWorkArrangementIcon(template.workArrangement)}{' '}
                        {template.workArrangement.charAt(0).toUpperCase() +
                          template.workArrangement.slice(1)}
                      </Badge>
                    </div>

                    {/* Payment Terms */}
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-gray-700">
                        Payment Terms:
                      </span>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {template.paymentTerms}
                      </p>
                    </div>

                    {/* Use Template Button */}
                    <Button
                      size="sm"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates available
              </h3>
              <p className="text-gray-600">
                Select a job category to see available templates
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Job Category Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-800 p-2 rounded">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Casual Work</h4>
                <p className="text-sm text-gray-600">
                  Flexible, short-term opportunities for individual contractors.
                  Perfect for photographers, musicians, and other service
                  providers looking for occasional work.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-800 p-2 rounded">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Subcontracting</h4>
                <p className="text-sm text-gray-600">
                  Project-based partnerships with established businesses. Ideal
                  for catering teams, decoration services, and other
                  professional service providers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-800 p-2 rounded">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Partnerships</h4>
                <p className="text-sm text-gray-600">
                  Long-term collaborative relationships with shared goals. Best
                  for venue partnerships, planning collaborations, and strategic
                  business alliances.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
