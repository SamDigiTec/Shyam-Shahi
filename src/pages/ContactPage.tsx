import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { SeoHead } from '../components/SeoHead';
import { SocialIcon } from '../components/Icons';

const contactSchema = z.object({
  full_name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  company: z.string().optional(),
  service_required: z.string().min(2, 'Please choose a service.'),
  estimated_budget: z.string().optional(),
  project_details: z.string().min(10, 'Please tell us a bit more about your project (min 10 characters).'),
  website_hp: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactPage() {
  const { data } = usePortfolioData();
  const [searchParams] = useSearchParams();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const settings = data?.settings;
  const services = data?.services || [];
  const contactPage = data?.pages.find((p) => p.slug === 'contact');
  const prefilledService = searchParams.get('service') || '';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      service_required: prefilledService || services[0]?.title || 'Social Media Management',
      estimated_budget: '',
      website_hp: '',
    },
  });

  useEffect(() => {
    if (prefilledService) {
      setValue('service_required', prefilledService);
    }
  }, [prefilledService, setValue]);

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);
    setSubmittedMessage(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/public/contact', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSubmittedMessage(res.message);
      reset({
        full_name: '',
        email: '',
        company: '',
        service_required: prefilledService || services[0]?.title || 'Social Media Management',
        estimated_budget: '',
        project_details: '',
        website_hp: '',
      });
    } catch (err) {
      setSubmitError((err as Error).message || 'Could not send message. Please try again.');
    }
  };

  const whatsappDigits = (settings?.whatsapp_number || '').replace(/[^0-9]/g, '');

  return (
    <>
      <SeoHead
        title={contactPage?.seo_title || 'Contact Shyam Shahi | Start a Project'}
        description={
          contactPage?.meta_description ||
          "Have a project in mind or looking to improve your digital presence? Let's work together."
        }
      />

      <section className="py-16 sm:py-24 bg-[#06152B]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00B8FF] mb-2">
                  Get In Touch
                </p>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F8FF]">
                  Let's Work Together.
                </h1>
                <p className="mt-4 text-base sm:text-lg text-[#A9BBD3] leading-relaxed">
                  Have a project in mind or looking to improve your digital presence? I'd love to hear about it.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href={`mailto:${settings?.contact_email || 'samsalewayscnc@gmail.com'}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-[#24466C] bg-[#0D2747] hover:border-[#2878FF] transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#2878FF]/15 flex items-center justify-center text-[#00B8FF] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#A9BBD3]">Email Address</div>
                    <div className="text-sm font-semibold text-[#F5F8FF]">
                      {settings?.contact_email || 'samsalewayscnc@gmail.com'}
                    </div>
                  </div>
                </a>

                {settings?.whatsapp_number && (
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl border border-[#24466C] bg-[#0D2747] hover:border-[#22C55E] transition-colors"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#22C55E]/15 flex items-center justify-center text-[#22C55E] shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#A9BBD3]">WhatsApp</div>
                      <div className="text-sm font-semibold text-[#F5F8FF]">
                        {settings.whatsapp_number}
                      </div>
                    </div>
                  </a>
                )}

                {settings?.location && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#24466C] bg-[#0D2747]">
                    <div className="w-11 h-11 rounded-xl bg-[#2878FF]/15 flex items-center justify-center text-[#00B8FF] shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#A9BBD3]">Location</div>
                      <div className="text-sm font-semibold text-[#F5F8FF]">{settings.location}</div>
                    </div>
                  </div>
                )}

                {settings?.business_hours && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#24466C] bg-[#0D2747]">
                    <div className="w-11 h-11 rounded-xl bg-[#2878FF]/15 flex items-center justify-center text-[#00B8FF] shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#A9BBD3]">Business Hours</div>
                      <div className="text-sm font-semibold text-[#F5F8FF]">{settings.business_hours}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#A9BBD3] mb-3">
                  Connect on Social
                </p>
                <div className="flex items-center gap-3">
                  {(settings?.social_links || []).map((soc, idx) => (
                    <a
                      key={idx}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={soc.platform}
                      className="w-11 h-11 rounded-xl border border-[#24466C] bg-[#0B1F3A] hover:border-[#2878FF] flex items-center justify-center text-[#A9BBD3] hover:text-[#00B8FF] transition-colors"
                    >
                      <SocialIcon platform={soc.platform} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Validated Lead Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[#24466C] bg-[#0D2747] p-6 sm:p-10">
                <h2 className="text-2xl font-bold text-[#F5F8FF] mb-2">Send a Project Inquiry</h2>
                <p className="text-sm text-[#A9BBD3] mb-8">
                  Fill out the form below and your inquiry goes directly into Shyam’s lead dashboard.
                </p>

                {submittedMessage && (
                  <div className="mb-6 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 flex items-start gap-3 text-sm text-[#F5F8FF]">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>{submittedMessage}</span>
                  </div>
                )}

                {submitError && (
                  <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                  {/* Honeypot field hidden from users */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                    {...register('website_hp')}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="full_name" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                        Full Name *
                      </label>
                      <input
                        id="full_name"
                        type="text"
                        placeholder="Your full name"
                        {...register('full_name')}
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] placeholder:text-[#A9BBD3]/50 focus:outline-none focus:border-[#2878FF]"
                      />
                      {errors.full_name && (
                        <p className="mt-1.5 text-xs text-rose-400">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        {...register('email')}
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] placeholder:text-[#A9BBD3]/50 focus:outline-none focus:border-[#2878FF]"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="company" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                        Company / Brand
                      </label>
                      <input
                        id="company"
                        type="text"
                        placeholder="Brand or company name"
                        {...register('company')}
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] placeholder:text-[#A9BBD3]/50 focus:outline-none focus:border-[#2878FF]"
                      />
                    </div>

                    <div>
                      <label htmlFor="service_required" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                        Service Required *
                      </label>
                      <select
                        id="service_required"
                        {...register('service_required')}
                        className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] focus:outline-none focus:border-[#2878FF]"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                        <option value="Full-Funnel Digital Growth">Full-Funnel Digital Growth</option>
                        <option value="Custom Consultation">Custom Consultation</option>
                      </select>
                      {errors.service_required && (
                        <p className="mt-1.5 text-xs text-rose-400">{errors.service_required.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="estimated_budget" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                      Estimated Budget (Optional)
                    </label>
                    <input
                      id="estimated_budget"
                      type="text"
                      placeholder="e.g. $500 – $1,500 / month or Project-based"
                      {...register('estimated_budget')}
                      className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] placeholder:text-[#A9BBD3]/50 focus:outline-none focus:border-[#2878FF]"
                    />
                  </div>

                  <div>
                    <label htmlFor="project_details" className="block text-xs font-semibold text-[#A9BBD3] mb-2">
                      Project Details *
                    </label>
                    <textarea
                      id="project_details"
                      rows={5}
                      placeholder="Share your goals, timeline, channels, or AI content requirements..."
                      {...register('project_details')}
                      className="w-full rounded-xl border border-[#24466C] bg-[#06152B] px-4 py-3 text-sm text-[#F5F8FF] placeholder:text-[#A9BBD3]/50 focus:outline-none focus:border-[#2878FF]"
                    />
                    {errors.project_details && (
                      <p className="mt-1.5 text-xs text-rose-400">{errors.project_details.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#2878FF] hover:bg-[#1E66E5] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
