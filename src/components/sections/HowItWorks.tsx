import { Search, FileCheck, CreditCard } from 'lucide-react';

const HOW_IT_WORKS_IMAGE = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80';

const steps = [
  {
    icon: Search,
    title: 'Search & choose',
    description: 'Browse homestays by province, dates, and guests. Read descriptions and see photos.',
  },
  {
    icon: FileCheck,
    title: 'Request to book',
    description: 'Send an inquiry to the host. They’ll confirm availability and approve your request.',
  },
  {
    icon: CreditCard,
    title: 'Pay & enjoy',
    description: 'Pay securely online. Then enjoy an authentic stay with a local family.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-secondary-50/80 shadow-md">
      <div className="grid gap-0 md:grid-cols-5">
        <div className="relative h-56 w-full md:col-span-2 md:h-auto md:min-h-[320px]">
          <img
            src={HOW_IT_WORKS_IMAGE}
            alt="Travelers enjoying a homestay"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-900/30 md:bg-transparent" />
        </div>
        <div className="p-8 md:col-span-3 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-primary-800 md:text-4xl">How it works</h2>
            <p className="mt-2 text-muted-foreground">
              Book your homestay in three simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-1">
            {steps.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-start sm:flex-row sm:items-center sm:gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                  <step.icon className="h-7 w-7" />
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-800">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      </div>
    </section>
  );
}
