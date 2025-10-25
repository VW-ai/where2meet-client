'use client';

import Avatar from './Avatar';

interface EventHostProps {
  hostName: string;
  hostAvatar?: string;
  hostBio?: string;
  contactNumber?: string;
}

export default function EventHost({ hostName, hostAvatar, hostBio, contactNumber }: EventHostProps) {
  return (
    <div className="bg-white border-t border-gray-300 px-8 py-6">
      <h2 className="text-2xl font-bold text-black mb-5 flex items-center gap-2">
        <span className="text-3xl">👑</span>
        Event Host
      </h2>

      <div className="p-5 bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-4 mb-3">
          <Avatar
            name={hostName}
            src={hostAvatar}
            size="xl"
            className="ring-2 ring-yellow-500"
          />
          <div className="flex-1">
            <div className="text-xl font-bold text-black">{hostName}</div>
            <div className="text-base text-yellow-700 font-medium">Event Organizer</div>
            {contactNumber && (
              <div className="text-base text-gray-700 mt-2 flex items-center gap-2">
                <span className="text-lg">📞</span>
                <a href={`tel:${contactNumber}`} className="hover:underline">
                  {contactNumber}
                </a>
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-yellow-500 text-black text-base font-bold rounded">
            HOST
          </div>
        </div>
        {hostBio && (
          <div className="pt-4 border-t border-yellow-200">
            <p className="text-base text-gray-700 italic">"{hostBio}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
