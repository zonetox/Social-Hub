export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-3xl p-8 md:p-12 border border-gray-100">
                <h1 className="text-4xl font-black text-gray-900 mb-8 text-center bg-clip-text text-transparent premium-gradient">
                    Privacy Policy
                </h1>

                <div className="prose prose-blue max-w-none space-y-8 text-gray-600">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                        <p>
                            We collect information you provide directly to us when you create an account, create a profile card, or make a payment. This may include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Name, email address, and profile details.</li>
                            <li>Social media links and contact information you choose to share.</li>
                            <li>Payment information (processed by third-party processors).</li>
                            <li>Proof of payment images for bank transfers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Process transactions and send related information.</li>
                            <li>Send technical notices, updates, security alerts, and support messages.</li>
                            <li>Log card sends and view activities for your analytics.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing of Information</h2>
                        <p>
                            We do not sell your personal data. We only share information to provide our services, comply with the law, or protect our rights.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
                        <p className="text-sm">
                            If you have any questions about this Privacy Policy, please contact us at <strong>privacy@socialhub.com</strong>
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
                    Last Updated: January 4, 2026
                </div>
            </div>
        </div>
    )
}
