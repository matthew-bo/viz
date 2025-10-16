import { useState } from 'react';
import { HelpCircle, X, Shield, Users, Lock, Zap } from 'lucide-react';

/**
 * CantonExplainer - Educational modal about Canton Network
 * Provides context for recruiters and viewers
 */
export default function CantonExplainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-canton-blue text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40"
        title="Learn about Canton Network"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-canton-blue to-canton-blue-dark text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Canton Privacy Blockchain
                  </h2>
                  <p className="text-blue-100">
                    Understanding Multi-Party Privacy-Preserving Transactions
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* What is Canton? */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-canton-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    What is Canton Network?
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Canton is a <strong>privacy-preserving blockchain</strong> developed by 
                  Digital Asset. Unlike public blockchains where everyone sees everything, 
                  Canton ensures that <strong>only parties involved in a transaction can see it</strong>.
                  This makes it ideal for financial institutions and enterprises that need both 
                  blockchain security and data privacy.
                </p>
              </section>

              {/* Key Features */}
              <section className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-green-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Sub-Transaction Privacy</div>
                      <div className="text-sm text-gray-600">
                        Only involved parties see transaction data
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Multi-Party Signatures</div>
                      <div className="text-sm text-gray-600">
                        Requires consent from all parties
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-yellow-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Global Ordering</div>
                      <div className="text-sm text-gray-600">
                        Synchronizer ensures transaction ordering
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">Cryptographic Proof</div>
                      <div className="text-sm text-gray-600">
                        Blockchain-level security guarantees
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How This Demo Works */}
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  How This Demo Works
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="font-semibold text-gray-900 mb-1">
                      Step 1: Submit Payment Request
                    </div>
                    <p className="text-sm text-gray-600">
                      Sender creates a <strong>PaymentRequest</strong> contract. Only the sender 
                      signs initially. The receiver can see it but hasn't signed yet.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="font-semibold text-gray-900 mb-1">
                      Step 2: Receiver Accepts
                    </div>
                    <p className="text-sm text-gray-600">
                      Receiver exercises the <strong>Accept</strong> choice, which creates a 
                      <strong>Payment</strong> contract with both signatures. This demonstrates 
                      multi-party blockchain workflow.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <div className="font-semibold text-gray-900 mb-1">
                      Step 3: Privacy Demonstration
                    </div>
                    <p className="text-sm text-gray-600">
                      Switch between party views using the Privacy Filter. You'll see that 
                      third parties <strong>cannot see</strong> transactions they're not 
                      involved in. This privacy is enforced at the Canton blockchain level, 
                      not just in the UI.
                    </p>
                  </div>
                </div>
              </section>

              {/* Comparison Table */}
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Canton vs. Traditional Blockchain
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 font-semibold">Feature</th>
                        <th className="text-left p-3 font-semibold">Public Blockchain</th>
                        <th className="text-left p-3 font-semibold">Canton Network</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Privacy</td>
                        <td className="p-3 text-gray-600">All data public</td>
                        <td className="p-3 text-green-600 font-medium">Private by default ✓</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="p-3 font-medium">Consensus</td>
                        <td className="p-3 text-gray-600">Global (expensive)</td>
                        <td className="p-3 text-green-600 font-medium">Sub-transaction ✓</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Scalability</td>
                        <td className="p-3 text-gray-600">Limited</td>
                        <td className="p-3 text-green-600 font-medium">High ✓</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="p-3 font-medium">Enterprise Ready</td>
                        <td className="p-3 text-gray-600">Challenging</td>
                        <td className="p-3 text-green-600 font-medium">Yes ✓</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Technology Stack */}
              <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Technology Stack</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Blockchain:</strong> Canton Community Edition 2.7.6</div>
                  <div><strong>Smart Contracts:</strong> Daml 2.7.6</div>
                  <div><strong>Backend:</strong> Node.js + TypeScript + Express</div>
                  <div><strong>Frontend:</strong> React 18 + TypeScript + TailwindCSS</div>
                  <div><strong>Real-time:</strong> Server-Sent Events (SSE)</div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-canton-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-canton-blue-dark transition-colors"
              >
                Got it, let's explore!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

