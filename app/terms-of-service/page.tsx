import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Try Out',
  description: 'The terms and conditions governing your use of Try Out.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: [
      {
        subtitle: 'Agreement',
        text: 'By accessing or using Try Out (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all users, including visitors, registered users, and paying customers.',
      },
      {
        subtitle: 'Updates',
        text: 'We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the "Last Updated" date. Continued use of the Service after such changes constitutes your acceptance of the updated Terms.',
      },
    ],
  },
  {
    title: '2. Description of Service',
    content: [
      {
        subtitle: 'What We Offer',
        text: 'Try Out is an AI-powered tool that generates YouTube thumbnail images based on text prompts, reference images, and style preferences you provide. Thumbnail generation consumes credits from your account balance.',
      },
      {
        subtitle: 'Credits',
        text: 'New accounts receive a limited number of complimentary credits. Additional credits can be purchased through our pricing plans. Credits are non-refundable except as described in Section 6 (Billing & Refunds). Unused credits do not expire unless your account is terminated.',
      },
    ],
  },
  {
    title: '3. Account Registration',
    content: [
      {
        subtitle: 'Eligibility',
        text: 'You must be at least 13 years of age to use the Service. By creating an account, you represent and warrant that you meet this requirement.',
      },
      {
        subtitle: 'Google OAuth',
        text: 'We use Google OAuth for authentication. You are responsible for maintaining the security of your Google account. Any activity that occurs through your Try Out account is your responsibility.',
      },
      {
        subtitle: 'Accuracy',
        text: 'You agree to provide accurate information during sign-in. We are not responsible for issues arising from inaccurate account information.',
      },
    ],
  },
  {
    title: '4. Acceptable Use',
    content: [
      {
        subtitle: 'Permitted Use',
        text: 'You may use the Service to generate thumbnail images for lawful purposes, including personal projects, content creation, and commercial use, subject to these Terms.',
      },
      {
        subtitle: 'Prohibited Content',
        text: 'You must not use the Service to generate content that: (a) is sexually explicit or involves minors; (b) promotes violence, hatred, or discrimination; (c) infringes upon any third-party intellectual property right; (d) constitutes spam or deceptive marketing; (e) violates any applicable local, national, or international law.',
      },
      {
        subtitle: 'No Abuse',
        text: 'You must not attempt to circumvent credit consumption, reverse-engineer the Service, use automated scripts to generate bulk requests beyond normal usage, or interfere with other users\' access to the Service.',
      },
    ],
  },
  {
    title: '5. Intellectual Property',
    content: [
      {
        subtitle: 'Your Content',
        text: 'You retain ownership of any reference images you upload and the prompts you write. By submitting content to the Service, you grant us a limited, non-exclusive license to process that content solely for the purpose of generating your thumbnails.',
      },
      {
        subtitle: 'Generated Images',
        text: 'Subject to your compliance with these Terms, you are granted a non-exclusive, worldwide license to use the thumbnail images generated for you for any lawful purpose, including commercial use. You acknowledge that similar images may be generated for other users using comparable prompts.',
      },
      {
        subtitle: 'Our IP',
        text: 'The Try Out name, logo, website design, and underlying technology are our exclusive intellectual property. You may not copy, modify, or distribute them without our prior written consent.',
      },
    ],
  },
  {
    title: '6. Billing & Refunds',
    content: [
      {
        subtitle: 'Payment',
        text: 'Credit packages are offered on a one-time purchase basis through our payment partner, Polar. All prices are in US dollars and are exclusive of applicable taxes, which you are responsible for.',
      },
      {
        subtitle: 'Refunds',
        text: 'Purchases are generally non-refundable once credits have been consumed. If you experience a technical error that incorrectly deducted credits from your balance, contact us within 7 days and we will investigate and restore credits as appropriate.',
      },
      {
        subtitle: 'Chargebacks',
        text: 'Initiating a chargeback or payment dispute without first contacting us may result in immediate suspension of your account. We encourage you to reach out to our support team first so we can resolve the issue quickly.',
      },
    ],
  },
  {
    title: '7. Disclaimers',
    content: [
      {
        subtitle: 'As-Is Service',
        text: 'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      },
      {
        subtitle: 'AI Limitations',
        text: 'AI-generated images may contain unexpected artifacts, inaccuracies, or may not exactly match your prompt. We do not guarantee that any generated thumbnail will achieve a specific click-through rate or meet your expectations.',
      },
      {
        subtitle: 'Service Availability',
        text: 'We do not guarantee uninterrupted or error-free access to the Service. We reserve the right to modify, suspend, or discontinue any feature at any time without liability.',
      },
    ],
  },
  {
    title: '8. Limitation of Liability',
    content: [
      {
        subtitle: 'Indirect Damages',
        text: 'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.',
      },
      {
        subtitle: 'Cap',
        text: 'Our total liability to you for any claim arising from use of the Service shall not exceed the amount you paid us in the twelve months preceding the claim.',
      },
    ],
  },
  {
    title: '9. Termination',
    content: [
      {
        subtitle: 'By You',
        text: 'You may stop using the Service at any time. To permanently delete your account and associated data, contact us at the email address in Section 11.',
      },
      {
        subtitle: 'By Us',
        text: 'We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or use the Service in a manner that causes harm to others. Remaining credits will be forfeited upon termination for cause.',
      },
    ],
  },
  {
    title: '10. Governing Law',
    content: [
      {
        subtitle: 'Jurisdiction',
        text: 'These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration or in the courts of competent jurisdiction, as applicable.',
      },
    ],
  },
  {
    title: '11. Contact',
    content: [
      {
        subtitle: 'Reach Us',
        text: 'If you have any questions about these Terms, please contact us at: legal@tryout.app. We aim to respond to all inquiries within 5 business days.',
      },
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a14 0%, #0d0a1a 40%, #080d14 100%)',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Subtle mesh gradient */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)', top: -120, right: -80 }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', top: '30%', left: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)', bottom: 0, right: '40%' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Back navigation */}
        <Link
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', marginBottom: 48,
            transition: 'color 0.2s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(96,165,250,0.10)',
            border: '1px solid rgba(96,165,250,0.20)',
            marginBottom: 16,
          }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1" width="12" height="14" rx="2" stroke="rgba(96,165,250,0.8)" strokeWidth="1.5"/>
              <path d="M5 5H11M5 8H11M5 11H9" stroke="rgba(96,165,250,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: 'rgba(96,165,250,0.8)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Legal
            </span>
          </div>
          <h1 style={{
            color: '#fff', fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700, margin: '0 0 12px',
            letterSpacing: '-0.5px', lineHeight: 1.2,
          }}>
            Terms of Service
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, margin: 0 }}>
            Last Updated: April 12, 2025
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '16px 0 0', lineHeight: 1.7 }}>
            Please read these Terms of Service carefully before using Try Out. These Terms form a binding legal agreement between you and Try Out. By creating an account or using the Service in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SECTIONS.map((section, si) => (
            <div
              key={si}
              style={{
                borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                overflow: 'hidden',
              }}
            >
              {/* Section title */}
              <div style={{
                padding: '20px 28px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <h2 style={{
                  color: 'rgba(96,165,250,0.85)',
                  fontSize: 15, fontWeight: 700,
                  margin: 0, letterSpacing: '-0.2px',
                }}>
                  {section.title}
                </h2>
              </div>

              {/* Subsections */}
              <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {section.content.map((item, ii) => (
                  <div key={ii}>
                    <h3 style={{
                      color: 'rgba(255,255,255,0.80)',
                      fontSize: 13, fontWeight: 600,
                      margin: '0 0 6px', letterSpacing: '0.01em',
                    }}>
                      {item.subtitle}
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.50)',
                      fontSize: 14, lineHeight: 1.75,
                      margin: 0,
                    }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer link */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, margin: '0 0 12px' }}>
            Also see our
          </p>
          <Link
            href="/privacy-policy"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10,
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.18)',
              color: 'rgba(96,165,250,0.75)', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
          >
            Privacy Policy
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
