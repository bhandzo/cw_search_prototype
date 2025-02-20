"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Position {
  title: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  type: string;
  jobDuration?: number;
}

interface School {
  name: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

interface ProfileDrawerProps {
  person: any;
  open: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ person, open, onClose }: ProfileDrawerProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    return format(new Date(dateString), 'MMM yyyy');
  };

  return (
    <div 
      className={`fixed top-0 right-0 w-1/3 h-screen bg-background border-l transform transition-transform duration-200 ease-in-out overflow-y-auto ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="flex justify-between items-center p-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">{person.name}</h2>
            <a 
              href={`https://${person.firmSlug}.clockworkrecruiting.com/firm/people/${person.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View in Clockwork
            </a>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tags */}
        {person.tags && person.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {person.tags.map((tag: { name: string }) => (
              <span key={tag.name} className="px-2 py-1 bg-secondary rounded text-sm">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Basic Information Card */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p>{person.preferredAddress || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p>{formatDate(person.updatedAt)}</p>
              </div>
              {person.preferredLinkedinUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a href={person.preferredLinkedinUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline">
                    Profile
                  </a>
                </div>
              )}
              {person.preferredEmailAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${person.preferredEmailAddress}`} className="text-blue-600 hover:underline">
                    {person.preferredEmailAddress}
                  </a>
                </div>
              )}
              {person.preferredPhoneNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{person.preferredPhoneNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Work History Card */}
          {person.positions && person.positions.length > 0 && (
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Work History</h3>
              <div className="space-y-6">
                {person.positions.map((position: Position, index: number) => (
                  <div key={`${position.title}-${position.startDate}-${index}`} className="border-l-2 pl-4 space-y-1">
                    <h4 className="font-medium">{position.title}</h4>
                    <a 
                      href={`https://${person.firmSlug}.clockworkrecruiting.com/firm/companies#${position.companyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {position.companyName}
                    </a>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(position.startDate)} - {position.endDate ? formatDate(position.endDate) : 'Present'}
                      {position.jobDuration !== undefined && (
                        <span className="ml-2">
                          ({position.jobDuration} {position.jobDuration === 1 ? 'year' : 'years'})
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Card */}
          {person.schools && person.schools.length > 0 && (
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">Education</h3>
              <div className="space-y-6">
                {person.schools.map((school: School) => (
                  <div key={school.name} className="space-y-1">
                    <h4 className="font-medium">{school.name}</h4>
                    {school.degree && (
                      <p className="text-muted-foreground">
                        {school.degree}{school.fieldOfStudy ? ` - ${school.fieldOfStudy}` : ''}
                      </p>
                    )}
                    {(school.startDate || school.endDate) && (
                      <p className="text-sm text-muted-foreground">
                        {school.startDate ? formatDate(school.startDate) : ''} 
                        {school.endDate ? ` - ${formatDate(school.endDate)}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
