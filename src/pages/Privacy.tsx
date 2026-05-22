import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="layout-container flex flex-col py-16">
      <div className="px-4 md:px-10 flex flex-1 justify-center">
        <div className="layout-content-container flex flex-col w-full max-w-[800px] flex-1 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Link to="/" className="text-primary hover:text-accent font-medium mb-8 inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Home
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-6">
            <p className="font-medium">Effective Date: May 18, 2026</p>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Introduction</h2>
              <p>
                YouthToPro Hub ("we", "our", or "us"), operating as a Free Zone entity within the United Arab Emirates (UAE), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our access portal and use our services, in accordance with the UAE Federal Decree-Law No. 45 of 2021 regarding the Protection of Personal Data (PDPL) and applicable Free Zone regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Information We Collect</h2>
              <p>We may collect information about you in a variety of ways, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Personal Data:</strong> Directly identifiable information such as your name, email address, phone number, and professional details provided during registration.</li>
                <li><strong>Usage Data:</strong> Information automatically collected when you access our portal, such as your IP address, browser type, operating system, and interaction with the platform.</li>
                <li><strong>Authentication Data:</strong> OAuth tokens and profile information provided by third-party services (e.g., Google) when you choose to log in through them.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Use of Your Information</h2>
              <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. We use information collected to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Facilitate account creation and authentication process.</li>
                <li>Match mentees with appropriate mentors based on professional profiles.</li>
                <li>Send administrative information, service updates, and notifications.</li>
                <li>Monitor and analyze usage and trends to improve user experience.</li>
                <li>Comply with UAE legal and Free Zone regulatory obligations.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Disclosure of Your Information</h2>
              <p>We do not sell your personal data. We may share information we have collected about you in certain situations:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to respond to legal process, investigate potential policy violations, or protect the rights, property, and safety of others, as permitted by UAE law.</li>
                <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf.</li>
                <li><strong>Platform Users:</strong> With your consent, limited profile information is shared between mentors and mentees to facilitate the mentorship process.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Data Storage and Security</h2>
              <p>
                Your data is stored securely using industry-standard encryption and security measures. In compliance with UAE data sovereignty preferences, we utilize cloud architecture optimized for the region. While we implement robust security measures, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">6. Your Data Rights</h2>
              <p>Under the UAE PDPL, you have specific rights regarding your personal data:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>The right to obtain information about your processed personal data.</li>
                <li>The right to request the correction of inaccurate data.</li>
                <li>The right to request the restriction of processing or deletion of your data (Right to be Forgotten).</li>
                <li>The right to data portability.</li>
              </ul>
              <p className="mt-2">To exercise any of these rights, please contact us using the details provided below.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">7. Contact Us</h2>
              <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
              <p className="mt-2 font-medium">YouthToPro Hub Compliance Team<br/>privacy@youthtoprofessionals.org</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
