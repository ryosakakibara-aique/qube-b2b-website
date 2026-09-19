-- Development seed for the product catalogue.
--
-- This is the single source of product fixtures. The previous TypeScript mock module was removed
-- because serving fabricated rows at runtime made a broken database indistinguishable from an
-- empty one (docs/DEVELOPMENT-PHASES.md §2.3).
--
-- Product copy below is the content already present in this repository. Content sections are
-- seeded only where real designed copy exists; the remaining products are expected to be authored
-- through the CMS.

insert into public.products (
  id, title, slug, description, tags, image_url, image_alt,
  acquisition, locations, cta_label, published
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'PANDORA 3.0',
    'pandora',
    'Convenient smart lockers that serve as 24/7 pickup and drop-off points for laundry shops, making it easy to leave and collect your laundry anytime.',
    array['smart locker', 'enterprise', 'PANDORA'],
    '/section-pandora.png',
    'PANDORA smart locker in use across business environments',
    'Talk to a QUBE Smart Solution Expert',
    'Multiple locations',
    'Talk to an Expert',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'University Locker',
    'university-locker',
    'Secure, convenient storage that supports students, staff, and campus operations.',
    array['education', 'campus', 'storage'],
    '/hero-demo.png',
    'University smart locker interface',
    'Request a campus consultation',
    'Campus locations',
    'Talk to an Expert',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Concert Locker',
    'concert-locker',
    'Fast, accessible storage that helps venues create a smoother guest experience.',
    array['events', 'venues', 'guest experience'],
    '/hero-demo.png',
    'Concert venue smart locker interface',
    'Plan your venue solution',
    'Venue locations',
    'Talk to an Expert',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'RFID Locker',
    'rfid-locker',
    'Connected locker access and tracking for organizations that need dependable control.',
    array['RFID', 'access', 'operations'],
    '/hero-demo.png',
    'RFID-enabled smart locker interface',
    'Discuss RFID integration',
    'Configured locations',
    'Talk to an Expert',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  tags = excluded.tags,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  acquisition = excluded.acquisition,
  locations = excluded.locations,
  cta_label = excluded.cta_label,
  published = excluded.published;

-- PANDORA content sections, from the designed product-detail frame.
insert into public.product_content_sections (product_id, sort_order, heading, body)
select p.id, section.sort_order, section.heading, section.body
from (
  values
    (1, 'WASH', 'Expand your laundry''s reach without building another branch - more efficient, more affordable, faster expansion. With the real-time data dashboard, you can monitor your customers transactions on-demand, remotely. With very informative statistics for more insightful, strategic adjustments.'),
    (2, 'DROP', 'Simply drop off your parcel at any of our convenient locations — no appointment needed. Our friendly staff will sort, tag, and process your items with care. With flexible drop-off hours and multiple access points across the city, accepting parcels with your busy schedule has never been easier.'),
    (3, 'KEEP', 'Need your favorite outfit stored safely? Our keep service lets you store seasonal clothing and bulky items in our climate-controlled facility. Access your wardrobe anytime through our app, and we''ll have your items freshly pressed and ready for pickup within hours of your request.'),
    (4, 'PAY', 'Pay only for what you use — no hidden fees, no subscriptions required. Our transparent pricing is calculated by weight and garment type, with real-time cost estimates before you confirm. Choose from multiple payment options including in-app payments, contactless tap, or monthly invoicing for business accounts.'),
    (5, 'When we say for every business needs', E'As a property manager - add a premium amenity that boosts tenant satisfaction and retention without the overhead of managing equipment\nAs a laundry merchant - expand your reach and grow revenue by connecting with residential buildings ready for modern laundry solutions\nAs an investor - tap into a recession-resistant, recurring-revenue model in the P20k+ shared laundry market\nFor your business amenity - offer employees and guests on-site laundry convenience that elevates your workplace experience')
) as section(sort_order, heading, body)
cross join public.products p
where p.slug = 'pandora'
on conflict (product_id, sort_order) do update set
  heading = excluded.heading,
  body = excluded.body;

-- Roles are assigned deliberately; new accounts start as unapproved `viewer` and grant nothing.
-- Approve the first administrator manually (both parts are required — `approved` is what makes the
-- role take effect):
--   update public.profiles set role = 'admin', approved = true where email = 'you@example.com';
