export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="bg-white shadow-xl rounded-3xl p-8 md:p-12 border border-gray-100">
                <h1 className="text-4xl font-black text-gray-900 mb-8 text-center bg-clip-text text-transparent premium-gradient">
                    Terms of Service
                </h1>

                <div className="prose prose-blue max-w-none space-y-8 text-gray-600">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Social HUB. By using our website and services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Membership & Payments</h2>
                        <p>
                            Social HUB offers an Annual Membership subscription and Card Credits for sending profile cards.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Annual Membership: $1 (20,000 VNĐ) per year.</li>
                            <li>Card Credits: $1 (20,000 VNĐ) per 100 credits.</li>
                            <li>All payments are processed securely via PayPal or Bank Transfer.</li>
                            <li>Subscriptions are non-refundable after successful activation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Conduct</h2>
                        <p>
                            Users are responsible for the content of their profile cards. You agree not to use Social HUB for any illegal or unauthorized purpose, including but not limited to harassment, spamming, or sharing offensive content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Accountability</h2>
                        <p>
                            Social HUB is not responsible for any misuse of the information shared on profile cards. Users share their information at their own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
                        <p className="text-sm">
                            If you have any questions about these Terms, please contact us at <strong>support@socialhub.com</strong>
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
