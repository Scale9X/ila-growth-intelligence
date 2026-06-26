/* Scale9X — Industry Intelligence Layer.
   Maps a business's industry to a growth-opportunity library (Revenue Expansion options,
   Strategic Bets, and "what to ignore" distractions). Qualitative only — NO financial
   projections, NO invented numbers. Used to make the report industry-specific.
   This is a knowledge library; it does not touch scoring, the framework, or workflows. */

const PLAYBOOKS = {
  healthcare: {
    label: 'Healthcare & Wellness',
    revenue: [
      { name: 'Structured doctor & specialist referrals', why: 'Referrals from GPs and specialists are the highest-trust, lowest-cost source of new patients for a clinical practice.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Community & group programs', why: 'Group sessions and a patient community improve outcomes and word-of-mouth while serving more people per practitioner hour.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Membership / care plans', why: 'Converting episodic visits into monthly care plans smooths cash flow and lifts lifetime value.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Corporate wellness contracts', why: 'Employers increasingly buy preventive health for staff — packageable as recurring B2B contracts.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Online programs & telehealth', why: 'Remote consultations and structured programs extend reach beyond the local catchment without adding clinic space.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Specialised treatment programs', why: 'Productising a niche (post-surgical, sports, chronic-condition) commands premium pricing and sharp positioning.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Digital products & courses', why: 'Self-paced programs monetise expertise at near-zero marginal cost and feed the top of the funnel.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Curated supplement / product line', why: 'A trusted practitioner can add a high-margin product line that complements treatment.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' }
    ],
    bets: [
      { name: 'National online program', why: 'Package the clinical method into a scalable online program serving clients nationwide — decoupling revenue from clinic capacity.' },
      { name: 'Corporate wellness division', why: 'Build a dedicated B2B arm selling recurring wellness contracts to employers — a fundamentally larger, more predictable market.' },
      { name: 'Branded product / supplement ecosystem', why: 'Turn clinical trust into a high-margin consumer product line that scales beyond one-to-one care.' }
    ],
    ignore: [
      'A custom mobile app before the core booking and follow-up process is reliable.',
      'Expensive brand redesigns before the referral and conversion engine works.',
      'Opening additional locations before the first site is systemised and profitable.',
      'Complex marketing automation before a simple, consistent follow-up habit exists.'
    ]
  },

  professional_services: {
    label: 'Professional Services',
    revenue: [
      { name: 'Retainers & recurring engagements', why: 'Converting project work into monthly retainers stabilises revenue and deepens client relationships.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Structured referral & partner program', why: 'Past clients and complementary firms are the warmest pipeline; a system to ask compounds it.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Premium / tiered packaging', why: 'A clear good/better/best ladder raises average engagement value and anchors pricing.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Productised service packages', why: 'Fixed-scope, fixed-price offerings shorten sales cycles and improve margins.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Thought-leadership engine', why: 'Consistent content and point-of-view builds inbound demand and premium positioning.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Strategic partnerships / channels', why: 'Partnering with adjacent providers opens new client pools without new acquisition spend.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Productised IP / light platform', why: 'Turn the delivery methodology into a repeatable product that scales beyond billable hours.' },
      { name: 'Enterprise / key-account motion', why: 'Build a deliberate motion to win and expand a small number of large accounts.' },
      { name: 'Training / certification arm', why: 'Monetise the firm’s expertise through paid training, certification or a community.' }
    ],
    ignore: [
      'Chasing every inbound lead instead of a sharp ideal-client focus.',
      'Heavy tooling investment before the delivery process is documented and repeatable.',
      'Discounting to win price-sensitive clients who erode margin and focus.',
      'Over-hiring ahead of a predictable pipeline.'
    ]
  },

  ecommerce: {
    label: 'E-commerce & Consumer Brands',
    revenue: [
      { name: 'Repeat-purchase & retention flows', why: 'Existing buyers are the cheapest revenue; post-purchase email/SMS nurture lifts repeat rate.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Bundles & cross-sell', why: 'Bundling raises average order value with no new acquisition cost.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Loyalty & referral program', why: 'Rewarding repeat buyers and referrals compounds organic growth.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Subscription / replenishment', why: 'Recurring orders for consumables create predictable revenue and higher lifetime value.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Marketplace / channel expansion', why: 'Selling on additional marketplaces or retail channels reaches new demand pools.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Product line extensions', why: 'Adjacent products to existing customers expand share of wallet.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Owned brand & community', why: 'Shift from transactional sales to an owned brand and community that commands loyalty and pricing power.' },
      { name: 'Cross-border / international expansion', why: 'Open new geographies to multiply the addressable market.' },
      { name: 'Private label / vertical integration', why: 'Control product and margin by developing private label or owning more of the supply chain.' }
    ],
    ignore: [
      'Discount-led growth that trains customers to wait for sales and erodes margin.',
      'Expanding SKUs before the best-sellers are fully merchandised and in stock.',
      'A custom-built platform before demand is proven on standard tooling.',
      'Scaling paid acquisition before retention and repeat-purchase work.'
    ]
  },

  manufacturing: {
    label: 'Manufacturing & Industrial',
    revenue: [
      { name: 'Account diversification program', why: 'Deliberately winning new mid-size accounts reduces dangerous customer concentration.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Aftermarket — service, parts & spares', why: 'Parts, service and maintenance contracts add high-margin recurring revenue to existing accounts.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Distributor & rep network expansion', why: 'Adding distributors and reps multiplies sales reach without proportional headcount.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'OEM / contract-manufacturing partnerships', why: 'Becoming a trusted OEM supplier creates large, sticky, recurring volume.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Product line extension', why: 'Adjacent products sold to existing accounts deepen wallet share.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Export / new geographic markets', why: 'Exporting opens substantially larger demand pools for proven products.', difficulty: 'High', impact: 'High', timeline: '12+ months' }
    ],
    bets: [
      { name: 'Export expansion', why: 'Build an export capability to access markets many times larger than the domestic base.' },
      { name: 'Private label / branded product', why: 'Move up the value chain from build-to-print toward owned, branded or private-label products.' },
      { name: 'Vertical integration / new capability', why: 'Add a capability (finishing, assembly, design) that captures more of the customer’s spend.' }
    ],
    ignore: [
      'Capacity expansion before the sales pipeline and quoting process can fill it.',
      'Bespoke software before the quote-to-cash basics are reliable.',
      'Chasing low-margin one-off jobs that crowd out strategic accounts.',
      'Diversifying into unrelated products before the core line is scaled.'
    ]
  },

  distribution: {
    label: 'Distribution & Wholesale',
    revenue: [
      { name: 'Lapsed-account reactivation', why: 'Dormant accounts in the existing base are the fastest, cheapest revenue to recover.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Value-added services', why: 'Kitting, vendor-managed inventory and delivery options justify premium pricing and lock customers in.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Online ordering / reorder portal', why: 'A self-serve reorder portal captures the long tail of accounts and lowers cost-to-serve.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Private label / exclusive lines', why: 'Owned or exclusive products lift margin and break commodity price competition.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Category / range expansion', why: 'Adding adjacent categories to existing customers grows share of wallet.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'New territory / segment expansion', why: 'Entering adjacent territories or customer segments opens new demand pools.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Digital distribution platform', why: 'Turn a traditional distributor into a defensible, scalable channel with a digital ordering and data platform.' },
      { name: 'Private-label ecosystem', why: 'Develop exclusive / private-label ranges to escape commodity price competition.' },
      { name: 'Adjacent-market expansion', why: 'Use logistics strength to enter adjacent product or customer markets.' }
    ],
    ignore: [
      'Competing on price against marketplaces instead of on service and availability.',
      'Adding SKUs before slow-movers and dead stock are cleared.',
      'Heavy systems spend before margin and account-level data are visible.'
    ]
  },

  saas: {
    label: 'SaaS & Software',
    revenue: [
      { name: 'Upsell & plan-tier migration', why: 'Moving existing customers up plan tiers is the highest-margin growth lever available.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Annual contracts / prepay', why: 'Shifting to annual plans improves cash flow and retention.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Expansion revenue (seats / usage)', why: 'Growing within existing accounts compounds net revenue retention.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Product-led growth motion', why: 'Self-serve trials and onboarding lower acquisition cost and accelerate adoption.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Channel & integration partnerships', why: 'Partners and integrations open distribution without linear sales cost.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Add-on modules', why: 'Adjacent modules raise average revenue per account within the existing base.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Enterprise sales motion', why: 'Build a deliberate enterprise motion to win and expand large, high-value accounts.' },
      { name: 'Platform & ecosystem', why: 'Open an API / marketplace so others build on the product — creating defensibility and reach.' },
      { name: 'New segment / vertical expansion', why: 'Productise for an adjacent vertical to multiply the addressable market.' }
    ],
    ignore: [
      'Building features for prospects who will never buy instead of expanding happy customers.',
      'Scaling paid acquisition before activation and retention are solid.',
      'Custom one-off builds that fragment the product roadmap.'
    ]
  },

  hospitality: {
    label: 'Hospitality & Food',
    revenue: [
      { name: 'Loyalty & repeat-visit program', why: 'Regulars drive most hospitality revenue; a simple loyalty loop lifts visit frequency.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Private events & catering', why: 'Events and catering monetise the brand and kitchen at high margin.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Delivery & off-premise channels', why: 'Delivery, takeaway and catering extend revenue beyond seat capacity.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Membership / subscription', why: 'Meal or coffee subscriptions create predictable recurring revenue.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Branded retail / packaged products', why: 'Selling signature products as retail extends the brand and margin.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Multi-site rollout', why: 'Systemise the format and expand to multiple locations once the first is profitable.' },
      { name: 'Branded packaged products', why: 'Turn signature items into a retail / CPG line sold beyond the venue.' },
      { name: 'Franchise / licensing', why: 'License a proven, systemised concept to grow capital-light.' }
    ],
    ignore: [
      'A second location before the first is consistently profitable and systemised.',
      'Expensive fit-outs before the core offer and operations are dialled in.',
      'Discount platforms that erode margin and loyalty.'
    ]
  },

  real_estate: {
    label: 'Real Estate & Property',
    revenue: [
      { name: 'Referral & past-client program', why: 'Repeat and referral business is the core of durable real-estate revenue.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Local market authority & content', why: 'Local authority generates inbound buyers and sellers at low cost.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' },
      { name: 'Recurring property management', why: 'Management fees create predictable recurring income alongside transactions.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Investor / portfolio services', why: 'Serving investors with portfolio and advisory services deepens high-value relationships.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Adjacent services (mortgage, legal, reno)', why: 'Partnered or owned adjacent services capture more of each transaction.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Recurring management arm', why: 'Build a property-management business for predictable, compounding recurring revenue.' },
      { name: 'Developer / co-investment vehicle', why: 'Move up the value chain into development or co-investment.' },
      { name: 'PropTech-enabled platform', why: 'Use technology to scale lead-to-close beyond a traditional agency.' }
    ],
    ignore: [
      'Chasing every listing instead of a focused niche and a nurtured database.',
      'Brand spend before a disciplined follow-up and CRM habit exists.'
    ]
  },

  generic: {
    label: 'Growth',
    revenue: [
      { name: 'Reactivate existing & lapsed customers', why: 'The existing base is the fastest, cheapest source of new revenue.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Structured referral system', why: 'Happy customers are the warmest pipeline; systematise asking for referrals.', difficulty: 'Low', impact: 'High', timeline: '0–3 months' },
      { name: 'Premium / tiered packaging', why: 'A clear value ladder raises average order value.', difficulty: 'Low', impact: 'Medium', timeline: '0–3 months' },
      { name: 'Recurring revenue / retainers', why: 'Converting one-off sales into recurring relationships stabilises growth.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'Strategic partnerships', why: 'Partners open new customer pools without new acquisition spend.', difficulty: 'Medium', impact: 'High', timeline: '3–12 months' },
      { name: 'New segment / market expansion', why: 'Adjacent segments or geographies expand the addressable market.', difficulty: 'Medium', impact: 'Medium', timeline: '3–12 months' }
    ],
    bets: [
      { name: 'Add a recurring revenue model', why: 'A recurring or platform model decouples growth from headcount.' },
      { name: 'Adjacent-market expansion', why: 'Enter an adjacent market that multiplies the addressable opportunity.' },
      { name: 'Productise the core offering', why: 'Package the core capability into a scalable, repeatable product.' }
    ],
    ignore: [
      'Expensive branding before the core conversion and follow-up engine works.',
      'Complex automation before a simple, consistent process exists.',
      'A mobile app or custom platform before demand is proven.'
    ]
  }
};

// Ordered so specific terms win (e.g. "Technology Consulting" → professional_services, not saas).
const CLASSIFIERS = [
  ['healthcare', ['dietit', 'nutrition', 'physio', 'dental', 'clinic', 'health', 'wellness', 'medical', 'therapy', 'chiropract', 'psycholog', 'aesthet', ' spa']],
  ['manufacturing', ['manufactur', 'fabricat', 'cnc', 'machining', 'factory', 'foundry', 'industrial', 'metalwork', 'assembly', 'tooling']],
  ['distribution', ['distribut', 'wholesale', 'supplies', 'supplier']],
  ['hospitality', ['restaurant', 'cafe', 'coffee', 'food', 'hotel', 'hospitality', 'catering', 'bakery', 'culinary']],
  ['real_estate', ['real estate', 'property', 'realty', 'developer', 'brokerage']],
  ['ecommerce', ['ecommerce', 'e-commerce', 'd2c', 'dtc', 'retail', 'online store', 'consumer brand', 'apparel', 'cosmetic', 'fashion', 'marketplace', 'shopify']],
  ['saas', ['saas', 'software', 'platform', 'application', 'b2b tech', 'cloud', 'mobile app']],
  ['professional_services', ['consult', 'agency', 'advisory', 'legal', ' law', 'account', 'marketing', 'professional service', 'services', 'studio', 'firm']]
];

function classify(industry, offerings) {
  const s = ((industry || '') + ' ' + (offerings || '')).toLowerCase();
  for (const [key, terms] of CLASSIFIERS) { if (terms.some(t => s.includes(t))) return key; }
  return 'generic';
}
function playbook(industry, offerings) { return PLAYBOOKS[classify(industry, offerings)] || PLAYBOOKS.generic; }

module.exports = { classify, playbook, PLAYBOOKS };
