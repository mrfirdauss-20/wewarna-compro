export const sectionOrder = [
  'nav', 'hero', 'marquee', 'collection', 'story',
  'process', 'lookbook', 'values', 'contact', 'footer', 'whatsapp',
]

export const sections = {
  nav: {
    title: 'Nav',
    fields: [
      { key: 'links', kind: 'list-object', label: 'Nav links', summaryKey: 'label', shape: [
        { key: 'label',  kind: 'text', label: 'Label' },
        { key: 'anchor', kind: 'text', label: 'Anchor id', shared: true },
      ]},
      { key: 'cta',     kind: 'text', label: 'CTA button label' },
      { key: 'atelier', kind: 'text', label: 'Atelier location' },
    ],
  },
  hero: {
    title: 'Hero',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline1',     kind: 'text', label: 'Headline line 1' },
      { key: 'headline2',     kind: 'text', label: 'Headline line 2' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic word' },
      { key: 'sub',           kind: 'textarea', label: 'Sub-copy' },
      { key: 'ctaPrimary',    kind: 'text', label: 'Primary CTA' },
      { key: 'ctaSecondary',  kind: 'text', label: 'Secondary CTA' },
      { key: 'badge',         kind: 'text', label: 'Badge label' },
      { key: 'sideTag',       kind: 'text', label: 'Vertical side tag', shared: true },
      { key: 'stats', kind: 'list-object', label: 'Stats', summaryKey: 'label', shape: [
        { key: 'value', kind: 'text', label: 'Value', shared: true },
        { key: 'label', kind: 'text', label: 'Label' },
      ]},
    ],
  },
  marquee: {
    title: 'Marquee',
    rootKind: 'list-string',
    rootLabel: 'Botanical names',
  },
  collection: {
    title: 'Collection',
    fields: [
      { key: 'eyebrow',         kind: 'text' },
      { key: 'headline',        kind: 'text', label: 'Section headline' },
      { key: 'headlineItalic',  kind: 'text', label: 'Headline italic part' },
      { key: 'side',            kind: 'textarea', label: 'Side description' },
      { key: 'inquireTemplate', kind: 'text', label: 'WA inquiry template (use {name})', shared: true },
      { key: 'products', kind: 'list-object', label: 'Products', summaryKey: 'name', shape: [
        { key: 'id',    kind: 'text', label: 'ID',    shared: true },
        { key: 'slot',  kind: 'text', label: 'Grid slot (c-a … c-f)', shared: true },
        { key: 'tag',   kind: 'text', label: 'Badge tag' },
        { key: 'name',  kind: 'text', label: 'Product name' },
        { key: 'sub',   kind: 'text', label: 'Sub-label (material)' },
        { key: 'price', kind: 'text', label: 'Price', shared: true },
        { key: 'image', kind: 'image', label: 'Product image', section: 'products', shared: true },
      ]},
    ],
  },
  story: {
    title: 'Story',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline',      kind: 'text', label: 'Headline' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic part' },
      { key: 'body',          kind: 'list-string', label: 'Body paragraphs' },
      { key: 'quote',         kind: 'textarea', label: 'Blockquote' },
      { key: 'attribution',   kind: 'text', label: 'Quote attribution' },
      { key: 'image',         kind: 'image', label: 'Atelier image', section: 'story', shared: true },
      { key: 'captionTitle',  kind: 'text', label: 'Image caption title' },
      { key: 'captionSub',    kind: 'text', label: 'Image caption sub', shared: true },
    ],
  },
  process: {
    title: 'Process',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline',      kind: 'text' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic part' },
      { key: 'side',          kind: 'textarea' },
      { key: 'steps', kind: 'list-object', label: 'Steps', summaryKey: 'title', shape: [
        { key: 'n',     kind: 'text', label: 'Number', shared: true },
        { key: 'title', kind: 'text' },
        { key: 'body',  kind: 'textarea' },
        { key: 'tag',   kind: 'text', shared: true },
      ]},
    ],
  },
  lookbook: {
    title: 'Lookbook',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline',      kind: 'text' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic part' },
      { key: 'side',          kind: 'textarea' },
      { key: 'looks', kind: 'list-object', label: 'Looks', summaryKey: 'title', shape: [
        { key: 'id',    kind: 'text', label: 'ID',    shared: true },
        { key: 'n',     kind: 'text', label: 'Number label', shared: true },
        { key: 'title', kind: 'text', label: 'Look title' },
        { key: 'image', kind: 'image', label: 'Look image', section: 'lookbook', shared: true },
      ]},
    ],
  },
  values: {
    title: 'Values',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline',      kind: 'text' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic part' },
      { key: 'sub',           kind: 'textarea' },
      { key: 'items', kind: 'list-object', label: 'Promises', summaryKey: 'title', shape: [
        { key: 'n',     kind: 'text', label: 'Numeral', shared: true },
        { key: 'title', kind: 'text' },
        { key: 'body',  kind: 'textarea' },
        { key: 'pin',   kind: 'text', label: 'Pin label', shared: true },
      ]},
    ],
  },
  contact: {
    title: 'Contact',
    fields: [
      { key: 'eyebrow',       kind: 'text' },
      { key: 'headline',      kind: 'text' },
      { key: 'headlineItalic',kind: 'text', label: 'Headline italic part' },
      { key: 'body',          kind: 'textarea' },
      { key: 'cta',           kind: 'text', label: 'WA button label' },
      { key: 'atelier',       kind: 'list-string', label: 'Atelier address lines', shared: true },
      { key: 'atelierLabel',  kind: 'text', label: 'Atelier label' },
      { key: 'whatsappLabel', kind: 'text', label: 'WhatsApp label' },
      { key: 'emailLabel',    kind: 'text', label: 'Email label' },
      { key: 'instagramLabel',kind: 'text', label: 'Instagram label' },
      { key: 'email',         kind: 'text', label: 'Email address', shared: true },
      { key: 'instagram',     kind: 'text', label: 'Instagram handle', shared: true },
      { key: 'instagramUrl',  kind: 'text', label: 'Instagram URL', shared: true },
    ],
  },
  footer: {
    title: 'Footer',
    fields: [
      { key: 'tagline',   kind: 'text' },
      { key: 'copyright', kind: 'text' },
      { key: 'links', kind: 'list-object', label: 'Footer links', summaryKey: 'label', shape: [
        { key: 'label',  kind: 'text' },
        { key: 'anchor', kind: 'text', shared: true },
      ]},
    ],
  },
  whatsapp: {
    title: 'WhatsApp',
    fields: [
      { key: 'number',         kind: 'text', label: 'WA number (digits only)', shared: true },
      { key: 'displayNumber',  kind: 'text', label: 'Display number (+62 format)', shared: true },
      { key: 'defaultMessage', kind: 'textarea', label: 'Default prefill message' },
    ],
  },
}
