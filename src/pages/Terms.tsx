import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="layout-container flex flex-col py-16">
      <div className="px-4 md:px-10 flex flex-1 justify-center">
        <div className="layout-content-container flex flex-col w-full max-w-[800px] flex-1 bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Link to="/" className="text-primary hover:text-accent font-medium mb-8 inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to Home
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-primary dark:text-white mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-6">
            <p className="font-medium">Effective Date: May 18, 2026</p>
            
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using YouthToPro Hub ("Platform", "we", "us", or "our"), you agree to abide by these Terms of Service. The Platform is operated by a corporate entity registered within a designated Free Zone in the United Arab Emirates (UAE). If you do not agree with any part of these terms, you must discontinue use of the Platform immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. User Registration and Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Eligibility:</strong> You must be at least 18 years of age to register as a mentor or mentee on our Platform.</li>
                <li><strong>Accuracy of Information:</strong> You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</li>
                <li><strong>Account Security:</strong> You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Acceptable Use Policy</h2>
              <p>As a user of the Platform, you agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Use the Platform for any illegal purpose or in violation of any local, state, national, or international law, including the laws of the UAE.</li>
                <li>Harass, abuse, defame, or otherwise infringe upon the rights of other users.</li>
                <li>Post or transmit any content that is offensive, discriminatory, or inappropriate within the cultural context of the UAE.</li>
                <li>Attempt to bypass or compromise any security measures of the Platform.</li>
                <li>Use the Platform to aggregate, copy, or duplicate any content or profiles for commercial purposes outside the scope of mentorship.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Mentorship Engagements</h2>
              <p>
                YouthToPro Hub serves as a facilitator connecting mentors and mentees. We do not guarantee employment, academic success, or specific career outcomes resulting from these connections. Mentors provide guidance voluntarily and their opinions do not necessarily represent the views of YouthToPro Hub.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Intellectual Property Rights</h2>
              <p>
                Unless otherwise indicated, the Platform is our proprietary property, and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Platform (collectively, the "Content") and the trademarks, service marks, and logos contained therein are owned or controlled by us, and are protected by applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">6. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by applicable law, in no event will YouthToPro Hub, its affiliates, directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages arising from your use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">7. Governing Law and Jurisdiction</h2>
              <p>
                These Terms shall be governed by and defined following the laws of the applicable Free Zone and the federal laws of the United Arab Emirates. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts within the respective Free Zone or the Emirate of Dubai, as applicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">8. Modifications to Terms</h2>
              <p>
                We reserve the right, in our sole discretion, to make changes or modifications to these Terms of Service at any time. We will alert you about any changes by updating the "Effective Date" of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">9. Contact Us</h2>
              <p>If you have questions or comments about these Terms, please contact us at:</p>
              <p className="mt-2 font-medium">YouthToPro Hub Legal Department<br/>legal@youthtoprofessionals.org</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
