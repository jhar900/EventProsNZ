'use client';

import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Linkedin, Mail, MapPin } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  location: string;
  linkedin?: string;
  email?: string;
  specialties: string[];
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Jason Hart',
    role: 'Founder of Event Pros NZ',
    bio: "With over a decade of experience organizing large-scale junior sports events across New Zealand, Jason founded EventPros to address the challenges he witnessed in the events sector. Having managed countless tournaments, competitions, and sporting events, he recognized the need for a better way to connect event managers with reliable contractors. EventPros was built as a solution to help streamline event planning and support the growth of New Zealand's vibrant events industry. Jason is also a doctor at Auckland City Hospital with aspirations of specialising in emergency medicine.",
    image: '/jason-hart.jpg',
    location: 'Auckland',
    linkedin: 'https://www.linkedin.com/in/thedailyjase/',
    email: 'jason@eventprosnz.co.nz',
    specialties: [
      'Event Management',
      'Sports Events',
      'Business Development',
      'Technical Development',
    ],
  },
];

export default function TeamSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the founder behind EventPros, dedicated to making your event
            planning experience exceptional.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {teamMembers.map(member => (
            <Card
              key={member.id}
              className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Photo Section */}
                <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 h-full">
                  {member.image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        style={
                          {
                            imageRendering: 'auto',
                            filter: 'contrast(1.1) saturate(1.1)',
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  ) : (
                    <Avatar className="w-48 h-48 mx-auto">
                      <AvatarFallback className="text-4xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600">
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <div className="mb-6">
                    <CardTitle className="text-3xl mb-2">
                      {member.name}
                    </CardTitle>
                    <p className="text-orange-600 font-semibold text-lg mb-3">
                      {member.role}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {member.location}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                      About {member.name.split(' ')[0]}
                    </h3>
                    {member.bio.split(' Jason is also').length > 1 ? (
                      <>
                        <p className="text-gray-600 leading-relaxed">
                          {member.bio.split(' Jason is also')[0]}
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-3">
                          Jason is also{member.bio.split(' Jason is also')[1]}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  {/* Specialties */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-3 text-gray-900">
                      Specialties:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.specialties.map(specialty => (
                        <Badge
                          key={specialty}
                          variant="outline"
                          className="text-sm px-3 py-1 border-orange-200 text-orange-700 bg-orange-50"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-3">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-colors border border-blue-200"
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="p-3 text-gray-600 hover:bg-gray-50 rounded-full transition-colors border border-gray-200"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
