'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    role: 'Founder of EventPros',
    bio: "With over a decade of experience organizing large-scale junior sports events across New Zealand, Jason founded EventPros to address the challenges he witnessed in the events sector. Having managed countless tournaments, competitions, and sporting events, he recognized the need for a better way to connect event managers with reliable contractors. EventPros was built as a solution to help streamline event planning and support the growth of New Zealand's vibrant events industry.",
    location: 'Auckland',
    linkedin: 'https://linkedin.com/in/jason-hart',
    email: 'jason@eventprosnz.co.nz',
    specialties: ['Event Management', 'Sports Events', 'Business Development'],
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

        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          {teamMembers.map(member => (
            <Card
              key={member.id}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={member.image} alt={member.name} />
                  <AvatarFallback className="text-lg">
                    {member.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{member.name}</CardTitle>
                <p className="text-primary font-semibold">{member.role}</p>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {member.location}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 text-sm">{member.bio}</p>

                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Specialties:</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.map(specialty => (
                      <Badge
                        key={specialty}
                        variant="outline"
                        className="text-xs"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="inline-block shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Join Our Team</h3>
              <p className="text-gray-600 mb-4">
                We&apos;re always looking for passionate New Zealanders to join
                our mission.
              </p>
              <a
                href="/careers"
                className="inline-flex items-center text-primary hover:underline font-semibold"
              >
                View Open Positions
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
