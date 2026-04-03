'use client';

import { motion } from 'framer-motion';

const PLATFORMS = [
  { name: 'Cloudflare', category: 'Edge & CDN' },
  { name: 'Vercel', category: 'Edge & CDN' },
  { name: 'Netlify', category: 'Edge & CDN' },
  { name: 'DigitalOcean', category: 'Cloud Infrastructure' },
  { name: 'Hetzner', category: 'Cloud Infrastructure' },
  { name: 'Google Cloud DNS', category: 'Cloud Infrastructure' },
  { name: 'AWS Route 53', category: 'Cloud Infrastructure' },
  { name: 'Vultr', category: 'Cloud Infrastructure' },
  { name: 'Akamai', category: 'Cloud Infrastructure' },
  { name: 'OVHcloud', category: 'Cloud Infrastructure' },
  { name: 'Porkbun', category: 'Domain Registrar' },
  { name: 'DNSimple', category: 'Domain Registrar' },
  { name: 'GoDaddy', category: 'Domain Registrar' },
  { name: 'Namecheap', category: 'Domain Registrar' },
  { name: 'Name.com', category: 'Domain Registrar' },
  { name: 'Gandi', category: 'Domain Registrar' },
  { name: 'Bunny.net', category: 'Domain Registrar' },
  { name: 'Dynadot', category: 'Domain Registrar' },
  { name: 'Hostinger', category: 'Domain Registrar' },
];

export default function SupportedPlatformsSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            19 Platforms. One Dashboard.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-500">
            Connect all your DNS providers in one place. From edge platforms to
            cloud infrastructure to domain registrars.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {PLATFORMS.map((platform, idx) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.03 }}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-800/50"
            >
              <div className="mb-2 text-center">
                <h3 className="text-lg font-bold text-white">
                  {platform.name}
                </h3>
                <p className="text-xs text-zinc-500">{platform.category}</p>
              </div>
              <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-zinc-500">
            More platforms coming soon. Request support for your provider.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
