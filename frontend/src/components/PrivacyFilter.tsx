import { memo } from 'react';
import { Eye, Users } from 'lucide-react';
import { Party } from '../types';

interface Props {
  parties: Party[];
  selectedParty: string | null;
  onChange: (party: string | null) => void;
}

/**
 * PrivacyFilter - Party selector for privacy demonstration
 * Allows viewing transactions from different parties' perspectives
 */
function PrivacyFilter({ parties, selectedParty, onChange }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-canton-blue" aria-hidden="true" />
        <h2 className="text-lg font-bold text-gray-900">Privacy Filter</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Select a party to see transactions from their perspective
      </p>

      <div 
        className="space-y-2"
        role="radiogroup"
        aria-label="Select party to filter transactions"
      >
        {/* All Parties Option */}
        <button
          onClick={() => onChange(null)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
            selectedParty === null
              ? 'bg-canton-blue text-white shadow-md scale-105'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
          role="radio"
          aria-checked={selectedParty === null}
          aria-label="Show all parties and transactions"
        >
          <Users className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">All Parties</div>
            <div className={`text-xs ${selectedParty === null ? 'text-blue-100' : 'text-gray-500'}`}>
              Show all transactions
            </div>
          </div>
        </button>

        {/* Individual Party Options */}
        {parties.map((party) => (
          <button
            key={party.displayName}
            onClick={() => onChange(party.displayName)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
              selectedParty === party.displayName
                ? 'bg-canton-blue text-white shadow-md scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            role="radio"
            aria-checked={selectedParty === party.displayName}
            aria-label={`Show transactions for ${party.displayName}`}
          >
            <Eye className="w-5 h-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="font-semibold">{party.displayName}</div>
              <div className={`text-xs truncate ${selectedParty === party.displayName ? 'text-blue-100' : 'text-gray-500'}`}>
                {party.partyId.split('::')[1]?.substring(0, 12)}...
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Privacy Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg" role="note">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Privacy Demo:</strong> Canton enforces privacy at the blockchain level. 
          Each party only sees contracts they're involved in.
        </p>
      </div>
    </div>
  );
}

export default memo(PrivacyFilter);

