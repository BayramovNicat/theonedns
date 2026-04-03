'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  {
    question: 'Is TheOneDNS free?',
    answer:
      'Yes! TheOneDNS is completely free to use. Connect unlimited platforms, manage unlimited domains, and sync unlimited DNS records at no cost. No credit card required.',
  },
  {
    question: 'How secure are my API credentials?',
    answer:
      'Your API credentials are encrypted with AES-256-GCM encryption before being stored in our database. We never see your keys in plain text, and they are only decrypted server-side when making API calls to your platforms. Your secrets stay secret.',
  },
  {
    question: 'Which platforms do you support?',
    answer:
      'We support 19 platforms including Cloudflare, Vercel, Netlify, AWS Route 53, Google Cloud DNS, DigitalOcean, Hetzner, Vultr, Linode, Porkbun, DNSimple, GoDaddy, Namecheap, Name.com, Gandi, OVH, Bunny DNS, Dynadot, and Hostinger.',
  },
  {
    question: 'Can I manage multiple domains?',
    answer:
      'Absolutely! You can connect unlimited domains across all supported platforms. Each domain is managed as a separate project, and you can switch between them instantly from your dashboard.',
  },
  {
    question: 'Do changes sync in real-time?',
    answer:
      "Yes. When you create, update, or delete a DNS record, the change is immediately sent to the platform's API. You'll see live status updates as the changes propagate to each provider.",
  },
  {
    question: 'What happens if a platform API goes down?',
    answer:
      "If a platform's API is temporarily unavailable, TheOneDNS will display an error message and allow you to retry the operation. Your other platforms will continue to work normally, and no data is lost.",
  },
  {
    question: 'Can I use this for my agency or team?',
    answer:
      'Yes! TheOneDNS is perfect for agencies managing client domains across multiple platforms. Each user has their own account with encrypted credentials, so you never need to share API keys with clients.',
  },
  {
    question: 'What DNS record types are supported?',
    answer:
      "Currently, we support A, AAAA, CNAME, MX, TXT, and NS records. We're actively working on adding support for additional record types like SRV, CAA, and PTR.",
  },
];

function FaqItem({ faq, index }: { faq: (typeof FAQS)[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-white/5"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-start justify-between gap-4 py-6 text-left transition-colors hover:text-amber-500"
      >
        <span className="text-lg font-semibold text-white">{faq.question}</span>
        <ChevronDown
          size={24}
          className={`shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <p className="pb-6 leading-relaxed text-zinc-400">{faq.answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function FaqSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-900/50 px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            Everything you need to know about TheOneDNS.
          </p>
        </motion.div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8">
          {FAQS.map((faq, index) => (
            <FaqItem key={faq.question} faq={faq} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-zinc-500">Still have questions?</p>
          <a
            href="mailto:support@theonedns.com"
            className="inline-flex items-center gap-2 text-amber-500 transition-colors hover:text-amber-400"
          >
            Contact our support team
          </a>
        </motion.div>
      </div>
    </section>
  );
}
