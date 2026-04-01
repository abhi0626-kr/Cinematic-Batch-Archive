import React, { Component, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

const PAGES = ['home', 'directory', 'gallery', 'story', 'guestbook'];

const PAGE_LABELS = {
  home: 'Home',
  directory: 'Directory',
  gallery: 'Gallery',
  story: 'Story',
  guestbook: 'Guestbook',
};

const GUESTBOOK_API_BASE = '/api/guestbook';

const pageTransition = {
  initial: { opacity: 0, x: 26 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -22 },
};

const DIRECTORY_FILTERS = [
  { key: 'all', label: 'All Students' },
  { key: 'boyz', label: 'Boyz' },
  { key: 'girls', label: 'Girls' },
  { key: 'class-a', label: 'Class-A' },
  { key: 'class-b', label: 'Class-B' },
  { key: 'faculty', label: 'Faculty' },
];

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  return PAGES.includes(hash) ? hash : 'home';
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: 'black', height: '100vh', zIndex: 99999 }}>
          <h2>React crashed!</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function useVaultEffects(pageKey) {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, observerOptions);

    const observeRevealElements = () => {
      const pageRoot = document.querySelector(`[data-page-root="${pageKey}"]`);
      const revealNodes = pageRoot ? pageRoot.querySelectorAll('.reveal-3d') : document.querySelectorAll('.reveal-3d');
      revealNodes.forEach((el) => revealObserver.observe(el));

      // Fallback to avoid invisible content if intersection events are delayed.
      window.setTimeout(() => {
        revealNodes.forEach((el) => el.classList.add('is-visible'));
      }, 520);
    };

    observeRevealElements();
    const delayedObserver = window.setTimeout(observeRevealElements, 520);

    const handleScroll = () => {
      const scrolled = window.pageYOffset;

      const heroBg = document.querySelector('[data-hero-bg]');
      const heroContent = document.querySelector('[data-hero-content]');

      if (heroBg) {
        heroBg.style.transform = `translateY(${scrolled * 0.35}px)`;
      }

      if (heroContent) {
        const rotation = Math.min(scrolled * 0.04, 14);
        heroContent.style.transform = `translateY(${scrolled * 0.2}px) rotateX(${rotation}deg)`;
      }

      document.querySelectorAll('.section-container').forEach((section) => {
        const rect = section.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const tiltIntensity = centerOffset * 0.01;

        section.querySelectorAll('.scroll-tilt').forEach((el) => {
          const depth = el.style.getPropertyValue('--depth') || '0px';
          el.style.setProperty('--tilt-x', `${tiltIntensity * -0.4}deg`);
          el.style.transform = `rotateX(var(--tilt-x)) translateZ(${depth})`;
        });
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    const handleMouseMove = (e) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - rect.width / 2;
      const dy = y - rect.height / 2;

      el.style.setProperty('--tilt-x', `${dy / -12}deg`);
      el.style.setProperty('--tilt-y', `${dx / 12}deg`);
    };

    const handleMouseLeave = (e) => {
      e.currentTarget.style.setProperty('--tilt-x', '0deg');
      e.currentTarget.style.setProperty('--tilt-y', '0deg');
    };

    const tiltElements = document.querySelectorAll('.scroll-tilt');
    tiltElements.forEach((el) => {
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      window.clearTimeout(delayedObserver);
      revealObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      tiltElements.forEach((el) => {
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [pageKey]);
}

function useSectionProgress(pageKey) {
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const pageRoot = document.querySelector(`[data-page-root="${pageKey}"]`);
      const nodes = pageRoot ? Array.from(pageRoot.querySelectorAll('[data-section]')) : [];
      const mapped = nodes.map((node, index) => ({
        id: node.id || `${pageKey}-section-${index + 1}`,
        label: node.getAttribute('data-section') || `Part ${index + 1}`,
      }));

      setSections(mapped);
      if (mapped[0]) {
        setActiveSectionId(mapped[0].id);
      }
    }, 80);

    return () => window.clearTimeout(timer);
  }, [pageKey]);

  useEffect(() => {
    const onScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        setScrollProgress(0);
        return;
      }

      setScrollProgress(Math.min(window.scrollY / scrollableHeight, 1));
    };

    window.addEventListener('scroll', onScroll);
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [pageKey]);

  useEffect(() => {
    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        threshold: 0.55,
        rootMargin: '-25% 0px -30% 0px',
      },
    );

    sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const jumpToSection = (sectionId) => {
    const node = document.getElementById(sectionId);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return { sections, activeSectionId, scrollProgress, jumpToSection };
}

function parseDirectoryQuery() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q') || '';
  const filter = params.get('filter') || 'all';
  const allowed = new Set(DIRECTORY_FILTERS.map((item) => item.key));

  return {
    searchTerm: q,
    activeFilter: allowed.has(filter) ? filter : 'all',
  };
}

function MainApp() {
  const [activePage, setActivePage] = useState(getPageFromHash());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setActivePage(getPageFromHash());
      setMobileNavOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useVaultEffects(activePage);
  const { sections, activeSectionId, scrollProgress, jumpToSection } = useSectionProgress(activePage);

  const navigate = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
    window.location.hash = page;
  };

  const pageProps = { onNavigate: navigate };

  let pageContent = null;

  if (activePage === 'directory') {
    pageContent = <DirectoryPage />;
  } else if (activePage === 'gallery') {
    pageContent = <GalleryPage />;
  } else if (activePage === 'story') {
    pageContent = <StoryPage />;
  } else if (activePage === 'guestbook') {
    pageContent = <GuestbookPage />;
  } else {
    pageContent = <HomePage {...pageProps} />;
  }

  return (
    <div className="font-body text-[#d6e5ef] bg-[#07151c] selection:bg-[#8ceff4]/30 antialiased relative w-full min-h-screen z-0 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(140,239,244,0.12),transparent_35%),radial-gradient(circle_at_80%_12%,rgba(255,217,187,0.08),transparent_30%),linear-gradient(180deg,#07151c,#031017)]" />
      <TopNav activePage={activePage} onNavigate={navigate} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
      <SectionProgress sections={sections} activeSectionId={activeSectionId} scrollProgress={scrollProgress} onJump={jumpToSection} />
      <main className="relative z-10 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            data-page-root={activePage}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {pageContent}
          </motion.div>
        </AnimatePresence>
      </main>
      <VaultFooter />
    </div>
  );
}

function TopNav({ activePage, onNavigate, mobileNavOpen, setMobileNavOpen }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#07151c]/65 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(140,239,244,0.08)] border-b border-[#8ceff4]/10">
      <div className="flex justify-between items-center px-5 md:px-12 py-5 w-full">
        <button className="text-xl md:text-2xl font-headline italic tracking-tight text-[#8ceff4]" onClick={() => onNavigate('home')}>
          THE VAULT
        </button>

        <div className="hidden md:flex items-center space-x-8">
          {PAGES.map((page) => (
            <button
              key={page}
              className={`text-[0.6875rem] font-medium tracking-wider uppercase pb-1 transition-colors duration-300 ${
                activePage === page
                  ? 'text-[#8ceff4] border-b border-[#8ceff4]/30'
                  : 'text-[#b2cbcd] hover:text-[#8ceff4]'
              }`}
              onClick={() => onNavigate(page)}
            >
              {PAGE_LABELS[page]}
            </button>
          ))}
        </div>

        <button className="md:hidden text-[#8ceff4]" onClick={() => setMobileNavOpen((open) => !open)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden px-5 pb-5 flex flex-col gap-3 border-t border-[#8ceff4]/10 bg-[#07151c]/95">
          {PAGES.map((page) => (
            <button
              key={page}
              className={`text-left text-xs tracking-[0.2em] uppercase py-2 ${
                activePage === page ? 'text-[#8ceff4]' : 'text-[#b2cbcd]'
              }`}
              onClick={() => onNavigate(page)}
            >
              {PAGE_LABELS[page]}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function SectionProgress({ sections, activeSectionId, scrollProgress, onJump }) {
  if (!sections.length) {
    return null;
  }
  return (
    <>
      <aside className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 items-center gap-4">
        <div className="h-44 w-[2px] bg-[#3e4949]/70 rounded-full overflow-hidden">
          <div
            className="w-full bg-gradient-to-b from-[#8ceff4] to-[#ffd9bb] transition-all duration-300"
            style={{ height: `${Math.max(scrollProgress * 100, 4)}%` }}
          />
        </div>
        <div className="flex flex-col gap-2">
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <button key={section.id} className="group flex items-center gap-2" onClick={() => onJump(section.id)}>
                <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#8ceff4] shadow-[0_0_12px_rgba(140,239,244,0.75)]' : 'bg-[#879393]/70 group-hover:bg-[#b2cbcd]'}`} />
                <span className={`text-[10px] tracking-[0.25em] uppercase transition-colors ${isActive ? 'text-[#8ceff4]' : 'text-[#879393] group-hover:text-[#b2cbcd]'}`}>
                  {section.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <aside className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-md bg-[#07151c]/85 backdrop-blur-md border border-[#8ceff4]/15 rounded-full px-4 py-3">
        <div className="w-full h-[2px] bg-[#3e4949]/70 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-[#8ceff4] to-[#ffd9bb] transition-all duration-300" style={{ width: `${Math.max(scrollProgress * 100, 6)}%` }} />
        </div>
        <div className="flex justify-between gap-2">
          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            return (
              <button key={section.id} onClick={() => onJump(section.id)} className={`flex-1 text-[9px] tracking-[0.2em] uppercase truncate transition-colors ${isActive ? 'text-[#8ceff4]' : 'text-[#879393]'}`}>
                {section.label}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}

function HomePage({ onNavigate }) {
  return (
    <>
      <header id="home-hero" data-section="Hero" className="relative h-[92vh] w-full flex items-center justify-center overflow-hidden" style={{ perspective: '1000px' }}>
        <div data-hero-bg className="absolute inset-0 z-0 parallax-layer">
          <img
            alt="College campus blur"
            className="w-full h-full object-cover filter blur-sm brightness-[0.3]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW6CrmDZA_2sthnugE_PuMATNrCZ7ePlbwWxJHtpjIWMlbIwBBqOPK_NhsyYDWkoI2D6f4EW2SULRbNY6y4MjpwZhsO5T1DCW7p75IAwwFz52cw0E9waforrpk1pvNviBDd3lAzJkyrM7nQiqHQ51yrR77YOaLjgR456U1hmNUMsjL3IwuFwzKmw7Wq3qWsdJWBgxHB2jFSG9IdT90L1V1D4rqOFt56f1f_Wv5eh-WXvU8Ox1af-IddGoLoBM6r8FitOFXLp43x7E"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07151c]/20 via-[#07151c]/45 to-[#07151c]" />
        </div>

        <div data-hero-content className="relative z-10 text-center px-6 max-w-4xl reveal-3d reveal-up">
          <h1 className="font-headline text-5xl md:text-8xl mb-8 tracking-tight leading-tight">
            Our Journey,
            <br />
            <span className="italic font-normal text-[#8ceff4] drop-shadow-[0_0_15px_rgba(140,239,244,0.4)]">Our Memories</span>
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
            <button
              className="px-10 py-4 bg-transparent border border-[#8ceff4]/50 text-[#8ceff4] hover:bg-[#8ceff4]/10 hover:shadow-[0_0_20px_rgba(140,239,244,0.3)] transition-all duration-500 text-sm font-medium tracking-widest uppercase"
              onClick={() => onNavigate('story')}
            >
              Read The Story
            </button>
            <button
              className="px-10 py-4 bg-transparent border border-[#879393]/30 text-[#b2cbcd] hover:text-[#d6e5ef] transition-all duration-500 text-sm font-medium tracking-widest uppercase"
              onClick={() => onNavigate('gallery')}
            >
              Open Gallery
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#b2cbcd]/50">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <span className="material-symbols-outlined animate-bounce">expand_more</span>
        </div>
      </header>

      <section id="home-links" data-section="Portals" className="py-24 px-6 section-container">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <QuickLinkCard title="The Archive Directory" subtitle="People, groups, and identities from the era." cta="Browse Directory" onClick={() => onNavigate('directory')} />
          <QuickLinkCard title="Leave a Trace" subtitle="Write a note in the memory ledger." cta="Open Guestbook" onClick={() => onNavigate('guestbook')} />
        </div>
      </section>
    </>
  );
}

function DirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [directoryPeople, setDirectoryPeople] = useState([]);

  // Fetch directory people from backend API
  useEffect(() => {
    fetch('/api/directory')
      .then(res => res.json())
      .then(data => setDirectoryPeople(Array.isArray(data.entries) ? data.entries : []))
      .catch(() => setDirectoryPeople([]));
  }, []);

  // Sync state to URL query params for bookmarking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    } else {
      params.delete('q');
    }

    if (activeFilter !== 'all') {
      params.set('filter', activeFilter);
    } else {
      params.delete('filter');
    }

    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [searchTerm, activeFilter]);

  // Reveal filtered profiles when filter changes
  useEffect(() => {
    const revealProfiles = () => {
      const revealNodes = document.querySelectorAll('[data-page-root="directory"] .reveal-3d');
      revealNodes.forEach((el) => {
        el.classList.add('is-visible');
      });
    };
    
    // Immediate reveal + delayed fallback
    revealProfiles();
    const timeout = window.setTimeout(revealProfiles, 100);
    
    return () => window.clearTimeout(timeout);
  }, [activeFilter, searchTerm, selectedProfile]);

  const filteredPeople = useMemo(() => {
    return directoryPeople.filter((person) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        keyword.length === 0 ||
        (person.name && person.name.toLowerCase().includes(keyword)) ||
        (person.roll && person.roll.toLowerCase().includes(keyword)) ||
        (person.department && person.department.toLowerCase().includes(keyword));

      if (!matchesKeyword) {
        return false;
      }

      // Apply filter based on activeFilter
      switch (activeFilter) {
        case 'all':
          return person.type === 'student';
        case 'faculty':
          return person.type === 'faculty';
        case 'boyz':
          return person.type === 'student' && person.gender === 'boyz';
        case 'girls':
          return person.type === 'student' && person.gender === 'girls';
        case 'class-a':
          return person.type === 'student' && person.classSection === 'class-a';
        case 'class-b':
          return person.type === 'student' && person.classSection === 'class-b';
        default:
          return false;
      }
    });
  }, [activeFilter, searchTerm, directoryPeople]);

  return (
    <section id="directory-archive" data-section="Archive" className="py-16 px-6 section-container">
      <div className="max-w-7xl mx-auto">
        {selectedProfile ? (
          <DirectoryProfileDetail profile={selectedProfile} onBack={() => setSelectedProfile(null)} />
        ) : (
          <>
            <PageTitle eyebrow="Directory" title="The Archive Index" description="A searchable register of people who shaped this chapter." />
            <div className="bg-[#142129] p-5 md:p-6 rounded shadow-lg flex flex-col xl:flex-row gap-6 items-center justify-between mb-16 reveal-3d reveal-up">
              <div className="relative w-full xl:w-2/5">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#879393]">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, roll, or department..."
                  className="w-full bg-[#0a151b] border border-transparent text-[#d6e5ef] pl-12 pr-4 py-4 rounded text-sm placeholder:text-[#879393] focus:outline-none focus:ring-1 focus:ring-[#8ceff4] transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-center xl:justify-end">
                {DIRECTORY_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-5 py-2.5 text-[9px] tracking-[0.15em] uppercase rounded-sm border transition-colors ${
                      activeFilter === filter.key
                        ? 'text-[#8ceff4] border-[#8ceff4] bg-[#8ceff4]/5'
                        : 'text-[#b2cbcd] border-[#3e4949] hover:border-[#879393] hover:text-[#d6e5ef]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-14 gap-x-8">
              {filteredPeople.map((person, index) => (
                <DirectoryProfile key={person.roll} {...person} delay={(index % 5) * 90} onClick={() => setSelectedProfile(person)} />
              ))}
            </div>
            {filteredPeople.length === 0 && (
              <p className="text-center text-sm tracking-[0.15em] uppercase text-[#879393] mt-10">No records match your filters.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
// GalleryPage is a visually-driven section that showcases a curated collection of photos and captions from the college years. It features a dynamic grid layout with staggered reveal animations, creating an immersive browsing experience. Each gallery item includes a brief description or memory associated with the image, adding context and emotional resonance to the visuals.
function GalleryPage() {
  return (
    <section id="gallery-grid" data-section="Gallery" className="py-16 section-container">
      <div className="px-6 md:px-12">
        <PageTitle eyebrow="Gallery" title="Fragments of Time" description="Moments stitched together from four unforgettable years." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {galleryItems.map((item, index) => (
            <GalleryItem key={item.label} img={item.img} label={item.label} className={index % 2 ? 'md:translate-y-10' : ''} delay={`${index * 120}ms`} />
          ))}
        </div>
      </div>
    </section>
  );
}
// StoryPage is a narrative-driven section that highlights key moments and themes from the college experience. It features a timeline of major events and a set of highlight cards that delve into specific memories or anecdotes. The design emphasizes storytelling with a mix of text and visuals, using reveal animations to create an engaging reading experience.
function StoryPage() {
  return (
    <>
      <section id="story-timeline" data-section="Timeline" className="py-16 px-6 section-container">
        <div className="max-w-6xl mx-auto">
         <PageTitle eyebrow="Story" title="The Three-Year Arc" description="From mid-2023 to mid-2026, this is the narrative spine of the class." />
            <div className="relative mt-14">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-[#3e4949]/30" />
            <TimelineEvent align="left" delay="0ms" term="FALL 2023" title="The Quiet Arrival" desc="We stepped into a new world together, nervous yet hopeful. The first semester set the foundation of friendships that would last forever." />
            <TimelineEvent align="right" delay="180ms" term="SPRING 2024" title="The Great Awakening" desc="The campus came alive with festivals, late-night study sessions, and shared achievements. We found our rhythm together." />
            <TimelineEvent align="left" delay="360ms" term="SUMMER 2025" title="The Peak Experience" desc="Growth, challenges overcome, and memories that shaped who we became. These were the unforgettable days." />
            <TimelineEvent align="right" delay="540ms" term="SPRING 2026" title="The Final Bow" desc="Graduation day arrived in a blur of caps, gowns, and tears. We walked out different, bonded by four years that changed everything." />
          </div>
        </div>
      </section>

      <section id="story-highlights" data-section="Highlights" className="py-16 px-6 bg-[#0f1d25] section-container">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {storyHighlights.map((item, index) => (
            <div key={item.title} className="p-8 bg-[#142129] reveal-3d reveal-up scroll-tilt" style={{ '--depth': `${20 + index * 10}px`, transitionDelay: `${index * 120}ms` }}>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#8ceff4] mb-4">{item.kicker}</p>
              <h3 className="font-headline text-2xl mb-4">{item.title}</h3>
              <p className="text-[#b2cbcd] leading-relaxed text-sm">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
// GuestbookPage is an interactive section that allows visitors to leave their own memories and messages. It features a form for submitting new entries, as well as a ledger that displays all submitted entries in reverse chronological order. Each entry includes the author's name, batch/department, message, and timestamp. Users can also edit or delete their entries, with changes reflected in real-time and persisted in local storage.
function GuestbookPage() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({ name: '', batch: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setErrorMessage('');
        const response = await fetch(GUESTBOOK_API_BASE);
        if (!response.ok) {
          throw new Error('Failed to load guestbook notes.');
        }

        const payload = await response.json();
        setEntries(Array.isArray(payload.entries) ? payload.entries : []);
      } catch {
        setErrorMessage('Backend is not reachable. Start the API server to save notes.');
        setEntries(seedGuestbookEntries);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [entries]);

  const submitEntry = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const batch = formData.batch.trim();
    const message = formData.message.trim();

    if (!name || !batch || !message) {
      return;
    }

    try {
      setErrorMessage('');
      const response = await fetch(GUESTBOOK_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, batch, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guestbook note.');
      }

      const payload = await response.json();
      if (payload?.entry) {
        setEntries((prev) => [payload.entry, ...prev]);
        setFormData({ name: '', batch: '', message: '' });
      }
    } catch {
      setErrorMessage('Could not save note to backend. Try again.');
    }
  };

  const updateField = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const deleteEntry = async (entryId) => {
    try {
      setErrorMessage('');
      const response = await fetch(`${GUESTBOOK_API_BASE}/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete guestbook note.');
      }

      setEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch {
      setErrorMessage('Could not delete note from backend.');
    }
  };

  const hasEntries = entries.length > 0;

  return (
    <section id="guestbook-ledger" data-section="Guestbook" className="py-16 px-6 section-container">
      <div className="max-w-6xl mx-auto">
        <PageTitle eyebrow="Guestbook" title="Leave a Trace" description="Sign the page and add one memory that deserves to stay." />
        {isLoading && <p className="text-center text-xs uppercase tracking-[0.15em] text-[#879393]">Loading notes...</p>}
        {errorMessage && <p className="text-center text-xs uppercase tracking-[0.08em] text-[#ffd9bb] mt-3">{errorMessage}</p>}
        <div className={`mt-10 grid gap-10 ${hasEntries ? 'md:grid-cols-2 items-start' : 'max-w-2xl mx-auto'}`}>
          <form className="space-y-8 reveal-3d reveal-left" onSubmit={submitEntry}>
            <input value={formData.name} onChange={updateField('name')} className="w-full bg-transparent border-0 border-b border-[#3e4949] py-4 focus:outline-none focus:ring-0 focus:border-[#8ceff4] transition-all duration-500 placeholder:text-[#b2cbcd]/30 text-[#d6e5ef]" placeholder="Name" type="text" />
            <input value={formData.batch} onChange={updateField('batch')} className="w-full bg-transparent border-0 border-b border-[#3e4949] py-4 focus:outline-none focus:ring-0 focus:border-[#8ceff4] transition-all duration-500 placeholder:text-[#b2cbcd]/30 text-[#d6e5ef]" placeholder="Batch / Department" type="text" />
            <textarea value={formData.message} onChange={updateField('message')} className="w-full bg-transparent border-0 border-b border-[#3e4949] py-4 focus:outline-none focus:ring-0 focus:border-[#8ceff4] transition-all duration-500 placeholder:text-[#b2cbcd]/30 text-[#d6e5ef] resize-none" placeholder="Your memory..." rows="5" />
            <button className="w-full py-4 border border-[#879393]/30 text-[#b2cbcd] text-xs tracking-widest uppercase hover:text-[#d6e5ef] hover:border-[#8ceff4]/50 transition-all duration-500">
              Submit the Note
            </button>

            {!hasEntries && (
              <p className="text-center text-[10px] tracking-[0.2em] uppercase text-[#879393] pt-2">
                Be the first to leave a memory.
              </p>
            )}
          </form>
          {hasEntries && (
            <div className="space-y-8">
              {entries.map((entry, index) => (
                <div key={entry.id} className="bg-[#142129] p-8 shadow-xl reveal-3d reveal-right is-visible scroll-tilt" style={{ '--depth': `${30 + index * 10}px`, transitionDelay: `${index * 150}ms` }}>
                  <span className="material-symbols-outlined text-[#8ceff4]/30 text-4xl block mb-4">format_quote</span>
                  <p className="font-headline italic text-lg text-[#d6e5ef] leading-relaxed mb-6">{entry.message}</p>
                  <p className="text-[10px] tracking-widest uppercase text-[#8ceff4]">{entry.author}</p>

                  <div className="flex gap-4 mt-6">
                    <button onClick={() => deleteEntry(entry.id)} className="text-[10px] uppercase tracking-[0.2em] text-[#ffd9bb] border-b border-[#ffd9bb]/40 pb-1">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-10 text-center reveal-3d reveal-up">
      <p className="text-[#8ceff4] text-[10px] tracking-[0.35em] uppercase mb-4">{eyebrow}</p>
      <h1 className="font-headline text-4xl md:text-6xl mb-5">{title}</h1>
      <p className="text-[#b2cbcd] max-w-2xl mx-auto text-sm md:text-base">{description}</p>
    </div>
  );
}

function QuickLinkCard({ title, subtitle, cta, onClick }) {
  return (
    <div className="bg-[#142129] p-8 md:p-10 border border-[#3e4949]/30 reveal-3d reveal-up scroll-tilt" style={{ '--depth': '26px' }}>
      <h3 className="font-headline text-3xl mb-4">{title}</h3>
      <p className="text-[#b2cbcd] text-sm leading-relaxed mb-7">{subtitle}</p>
      <button className="text-xs uppercase tracking-[0.2em] text-[#8ceff4] border-b border-[#8ceff4]/40 pb-2" onClick={onClick}>
        {cta}
      </button>
    </div>
  );
}

function VaultFooter() {
  return (
    <footer className="relative z-10 w-full py-12 px-6 md:px-12 bg-[#07151c] border-t border-[#879393]/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-lg font-headline text-[#8ceff4] opacity-60">THE VAULT</div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#b2cbcd] text-center md:text-right">Cinematic Archive. All memories reserved.</p>
      </div>
    </footer>
  );
}

function TimelineEvent({ align, term, title, desc, delay }) {
  const isLeft = align === 'left';
  const revealClass = isLeft ? 'reveal-left' : 'reveal-right';
  return (
    <div className={`relative flex ${isLeft ? 'justify-start' : 'justify-end'} items-center mb-32 group reveal-3d ${revealClass}`} style={{ transitionDelay: delay }}>
      <div className={`w-full md:w-1/2 ${isLeft ? 'pr-0 md:pr-16 text-right' : 'pl-0 md:pl-16 text-left'}`}>
        <div className={`bg-[#0f1d25] p-8 shadow-2xl transition-all duration-500 hover:scale-[1.05] border-[#8ceff4]/0 hover:border-[#8ceff4]/40 scroll-tilt ${isLeft ? 'border-r-2' : 'border-l-2'}`} style={{ '--depth': '20px' }}>
          <span className="font-label text-[#8ceff4]/60 text-xs mb-2 block tracking-widest">{term}</span>
          <h3 className="font-headline text-2xl mb-4 italic text-[#d6e5ef]">{title}</h3>
          <p className="text-[#b2cbcd] text-sm leading-relaxed font-body">{desc}</p>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[#8ceff4] rounded-full shadow-[0_0_10px_rgba(140,239,244,0.8)]" />
    </div>
  );
}

function GalleryItem({ img, label, className = "", delay }) {
  return (
    <div className={`aspect-[4/5] overflow-hidden group relative cursor-crosshair reveal-3d reveal-up ${className}`} style={{ transitionDelay: delay }}>
      <img alt={label} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110 scroll-tilt" src={img} />
      <div className="absolute inset-0 border-[0px] group-hover:border-[12px] border-[#8ceff4]/20 transition-all duration-500" />
      <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[#07151c]/80 backdrop-blur-md p-4">
        <p className="text-[10px] uppercase tracking-widest font-label">{label}</p>
      </div>
    </div>
  );
}

function FaceItem({ img, name, delay, depth }) {
  return (
    <div className="group cursor-pointer reveal-3d reveal-up" style={{ '--depth': depth, transitionDelay: delay }}>
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 ring-offset-4 ring-offset-[#07151c] ring-0 group-hover:ring-2 ring-[#8ceff4] transition-all duration-500 shadow-[0_0_20px_rgba(140,239,244,0)] group-hover:shadow-[0_0_20px_rgba(140,239,244,0.4)]">
        <img alt="Student" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={img} />
      </div>
      <p className="font-label text-[10px] tracking-widest uppercase text-[#b2cbcd]">{name}</p>
    </div>
  );
}

function DirectoryProfile({ img, name, roll, delay, onClick, imgPosition }) {
  return (
    <button type="button" onClick={onClick} className="group cursor-pointer reveal-3d reveal-up flex flex-col items-center text-center" style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-28 h-28 md:w-36 md:h-36 mb-5 rounded-[1.25rem] overflow-hidden bg-[#0f1d25] border border-[#3e4949]/30 group-hover:border-[#8ceff4]/60 transition-all duration-500 shadow-xl group-hover:shadow-[0_10px_30px_rgba(140,239,244,0.15)] group-hover:-translate-y-2">
        <img alt={name} src={img} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 hover:scale-105" style={{ objectPosition: imgPosition || 'center top' }} />
      </div>
      <h4 className="font-headline text-xl text-[#d6e5ef] mb-1 group-hover:text-[#8ceff4] transition-colors">{name}</h4>
      <p className="font-label text-[9px] tracking-[0.2em] font-bold uppercase text-[#879393]">{roll}</p>
    </button>
  );
}

function DirectoryProfileDetail({ profile, onBack }) {
  const coverSrc = profile.img;
  const coverPosition = profile.imgPosition || 'center 20%';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [profile.id]);

  return (
    <article className="w-full reveal-3d reveal-up is-visible">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[#8ceff4] text-[10px] tracking-[0.35em] uppercase mb-2">Directory</p>
          <h2 className="font-headline text-3xl md:text-5xl text-[#d6e5ef]">Profile Dossier</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-[#879393]/40 text-[#b2cbcd] text-xs tracking-[0.2em] uppercase hover:border-[#8ceff4]/60 hover:text-[#d6e5ef] transition-colors"
        >
          Back to Directory
        </button>
      </div>

      <div className="group relative overflow-hidden border border-[#3e4949]/30 bg-[#0b1b24] h-[300px] md:h-[420px] cursor-pointer">
        <img
          src={coverSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 blur-[2px] opacity-40 scale-110 transition-all duration-700"
          style={{ objectPosition: coverPosition }}
        />
        <img
          src={coverSrc}
          alt={profile.name}
          className="relative z-[1] w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-700"
          style={{ objectPosition: coverPosition }}
        />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#07151c] via-[#07151c]/50 to-transparent" />
        <div className="absolute left-6 md:left-10 bottom-8 md:bottom-10 z-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#b2cbcd] mb-2">Archive Record</p>
          <h3 className="font-headline italic text-4xl md:text-7xl text-[#8ceff4] leading-none mb-3">{profile.name}</h3>
          <p className="text-[#d6e5ef] text-xs md:text-sm tracking-[0.22em] uppercase">{profile.roll}</p>
        </div>
      </div>

      

      <section className="bg-[#0b1b24] border-x border-b border-[#3e4949]/30 py-12 px-6 md:px-10">
        <div className="grid md:grid-cols-[1.2fr_2fr] gap-12 items-start">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#8ceff4] mb-6">Academic Standing</p>
            <div className="border-t border-[#3e4949]/40 pt-4 mb-6">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#879393] mb-2">Major</p>
              <p className="font-headline italic text-xl text-[#d6e5ef]">{profile.department}</p>
            </div>
            <div className="border-t border-[#3e4949]/40 pt-4">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#879393] mb-2">Batch</p>
              <p className="font-headline italic text-xl text-[#d6e5ef]">{profile.batch}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#ffd9bb] mb-6">Curator's Note</p>
            <p className="text-[#d6e5ef] text-lg leading-relaxed">
              {profile.name}'s dossier reflects growth, discipline, and a unique contribution to the {profile.department} chapter of this archive.
              These fragments preserve both achievement and memory.
            </p>
            <button type="button" className="mt-8 px-6 py-3 border border-[#879393]/40 text-[10px] tracking-[0.22em] uppercase text-[#d6e5ef] hover:border-[#8ceff4]/60 transition-colors">
              Download Full Dossier
            </button>
          </div>
        </div>
      </section>
    </article>
  );
}

const galleryItems = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJpzDYG0SqLwD1JuEi8M1mnA4WITdCK9RkVxNO2udV84ZkYsMNWHIiG3RLIGKCiobq-w5w19otrU88mikIT0sRvzD6NznHBxUj7eMzjOXYwwhhWm_lj5wKkXL4WGmXwQdZi8kFyqfxw6mps_ytKIOnj_nJlvd7tfIXEx1QujpkKzzIIsja0UQhAgaZ1CQPqZDqS8kOpaqG3WmR2nRz0IYwHVJVDGshww4ylA3kk7DqukXtkYZCO43I8zkUQAgCLkYfC4qPnD4kQ1Y',
    label: 'The Library Sessions',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEaqwpX5cr7OQDryCP5lv1SM3wjJNA5BcpRgdInGsuoCdr0WfvnD1xzQkUQmEn3TJdi9atMdPaD1IYWtOCVhqP5wnLnVVv0RAP2DXUCSh-EF1UttnWfw_Mr-YhqHfHbGsNMcWBGvCTBs-TBGn-xRZukRkCVehECA7MRRK3lbSa3fUbJtjaw20iB6mWNergR-iqGovfRZHGhy0NRY8tsDx_dednEq1eoz64uJNTA2j-gKO-F4lllWEX6dBoo3XrrxjSqetVlZahcCs',
    label: 'Midnight Echoes',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDbueIJI2Z7UDtGlowgAqJBSFp7u0DhE1pSALTdzU81K08PrmUS2rqyNZcLmv6iJEu1iUumBHqcVvK0Rruj4QGY_DwYzCv20wW1-3bohjpiEcsp4bUWYNRq9GosRTaqhS8Mi54psfc3HxobV3xZL4Ui2rpPYBubkkNvq1-GMqNeKakKZXCtkfjhVVgBazZ_b1fB_zsQvYHcF0UJAI1uidTKOhy1EofIi3SSjC43N7-tFP8w-3FD1zYbz4ZkZbQoKwT8tTfG8v1RwU',
    label: 'Ivy & Stone',
  },
  {
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1200&auto=format&fit=crop',
    label: 'Courtyard Laughter',
  },
  {
    img: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=1200&auto=format&fit=crop',
    label: 'Lab Nights',
  },
  {
    img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop',
    label: 'Final Walk',
  },
];







// DirectoryPage is a comprehensive section that serves as an index of all individuals associated with the college experience. It features a searchable and filterable directory of profiles, allowing users to explore classmates, faculty, and staff. Each profile includes a photo, name, roll number, department, batch, and a brief curator's note. The design emphasizes accessibility and ease of navigation, with reveal animations to enhance the browsing experience.
const directoryPeople = [
  {
    img: '/assets/Abhishek KR.jpeg',
    imgPosition: 'center 16%',
    name: 'Abhishek KR',
    roll: 'ROLL: 355U1238002',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: '/assets/Anbuselvan K.jpeg',
    imgPosition: 'center 16%',
    name: 'Anbuselvan K',
    roll: 'ROLL: 35523U18006',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 45%',
    name: 'Arthur Pendel',
    roll: 'ROLL: HIS-2026-077',
    department: 'History',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 46%',
    name: 'Cora Night',
    roll: 'ROLL: MUS-2026-091',
    department: 'Music',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-b',
  },
  {
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 16%',
    coverPosition: 'center 52%',
    name: 'David Sterling',
    roll: 'ROLL: SCI-2026-201',
    department: 'Data Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: '/assets/Dhanush V.jpeg',
    imgPosition: 'center 16%',
    name: 'Dhanush V',
    roll: 'ROLL: 35523U18016',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 16%',
    coverPosition: 'center 48%',
    name: 'Dr. Ethan Vale',
    roll: 'ID: FAC-ART-007',
    department: 'Visual Communication',
    batch: 'Faculty',
    type: 'faculty',
  },
  {
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 46%',
    name: 'Elara Vance',
    roll: 'ROLL: ART-2026-112',
    department: 'Fine Arts',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 48%',
    name: 'Isabella Hunt',
    roll: 'ROLL: LIT-2026-022',
    department: 'Literature',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-b',
  },
  {
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 50%',
    name: 'Julian Thorne',
    roll: 'ROLL: ARCH-2026-004',
    department: 'Architecture',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: '/assets/Kumaraguru J.jpeg',
    imgPosition: 'center 16%',
    name: 'kumaraguru J',
    roll: 'ROLL: 35523U18033',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 20%',
    coverPosition: 'center 48%',
    name: 'Leo Sterling',
    roll: 'ROLL: LAW-2026-003',
    department: 'Law',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 16%',
    coverPosition: 'center 44%',
    name: 'Marcus Chen',
    roll: 'ROLL: ENG-2026-089',
    department: 'Computer Engineering',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Mohanaaswath M.jpeg',
    imgPosition: 'center 16%',
    name: 'Mohanaaswath M',
    roll: 'ROLL: 35523U18041',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
  {
    img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 16%',
    coverPosition: 'center 50%',
    name: 'Nia Okoro',
    roll: 'ROLL: ECO-2026-154',
    department: 'Economics',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-a',
  },
  {
    img: '/assets/Nithin Kishore T.jpeg',
    imgPosition: 'center 16%',
    name: 'Nithin Kishore T',
    roll: 'ROLL: CSE-2026-205',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-a',
  },
    {
      img: '/assets/Nivetha G.jpeg',
      imgPosition: 'center 16%',
      name: 'Nivetha G',
      roll: '35523U18061',
      department: 'Computer Science',
      batch: '2026',
      type: 'student',
      gender: 'girls',
      classSection: 'class-a',
    },
  {
    img: '/assets/Poovarasan K.jpeg',
    imgPosition: 'center 16%',
    name: 'Poovarasan K',
    roll: '35523U18053',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Pradeep P.jpeg',
    imgPosition: 'center 16%',
    name: 'Pradeep P',
    roll: '35523U18055',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Senbagapriya G.jpeg',
    imgPosition: 'center 16%',
    name: 'Senbagapriya G',
    roll: '35523U18061',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-b',
  },
  {
    img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 18%',
    coverPosition: 'center 45%',
    name: 'Prof. Mira Kline',
    roll: 'ID: FAC-ENG-012',
    department: 'Systems Engineering',
    batch: 'Faculty',
    type: 'faculty',
  },
  {
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
    coverImg: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop',
    imgPosition: 'center 20%',
    coverPosition: 'center 45%',
    name: 'Sophia Rossi',
    roll: 'ROLL: DES-2026-045',
    department: 'Design',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-a',
  },
  {
    img: '/assets/Sonthosh M.jpeg',
    imgPosition: 'center 16%',
    name: 'Sonthosh M',
    roll: 'ROLL: 35523U18073',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Umamagesh M.jpeg',
    imgPosition: 'center 16%',
    name: 'Umamagesh M',
    roll: '35523U18061',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'girls',
    classSection: 'class-b',
  },
  {
    img: '/assets/Vikram M.jpeg',
    imgPosition: 'center 16%',
    name: 'Vikram M',
    roll: '35523U18099',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Rajesh S.jpeg',
    imgPosition: 'center 16%',
    name: 'Rajesh S',
    roll: '35523U18061',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
  {
    img: '/assets/Sounder Raj A.jpeg',
    imgPosition: 'center 16%',
    name: 'Sounder Raj A',
    roll: '35523U18081',
    department: 'Computer Science',
    batch: '2026',
    type: 'student',
    gender: 'boyz',
    classSection: 'class-b',
  },
];

const DIRECTORY_DOSSIERS = {
  'ROLL: ARCH-2026-004': {
    quote: 'In the quiet of the drafting studio, ideas learned how to breathe.',
    milestones: [
      { title: 'First Day', body: 'Walked into the architecture lab and met the team that turned sketches into stories.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'An all-nighter before jury where everyone shared coffee, critique, and courage.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Pinned the final board and left the studio lights with gratitude.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: ART-2026-112': {
    quote: 'Color taught us courage before any classroom ever did.',
    milestones: [
      { title: 'First Day', body: 'Met the Fine Arts cohort and filled the first canvas with uncertain strokes.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'A campus mural night where every brushstroke felt like a shared heartbeat.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Packed the studio corner and carried every unfinished sketch forward.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: ENG-2026-089': {
    quote: 'Every bug we solved became a small lesson in patience.',
    milestones: [
      { title: 'First Day', body: 'First coding lab, first compile error, first team that stayed after class to help.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Hackathon weekend where we built, broke, and rebuilt until sunrise.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Demoed the capstone and signed off the last commit from campus.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: DES-2026-045': {
    quote: 'Good design began where empathy met discipline.',
    milestones: [
      { title: 'First Day', body: 'Started with wireframes and learned to ask better questions before drawing.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Presentation day when our prototype finally felt human and complete.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Closed the design board and archived our favorite iterations.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: SCI-2026-201': {
    quote: 'Data gave us patterns, but people gave those patterns meaning.',
    milestones: [
      { title: 'First Day', body: 'First statistics session and a notebook full of curious questions.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Model review night where the whole group celebrated tiny accuracy wins.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Published the final dashboard and documented every learning.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: LIT-2026-022': {
    quote: 'Pages became places where we met ourselves again.',
    milestones: [
      { title: 'First Day', body: 'Walked into literature class and fell in love with close reading.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Poetry evening in the courtyard with voices echoing long after.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Submitted the final paper and left with a shelf of marked books.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: HIS-2026-077': {
    quote: 'The past stopped feeling distant once we learned to listen carefully.',
    milestones: [
      { title: 'First Day', body: 'First archive room visit and a long afternoon with primary sources.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Museum field study that made every lecture suddenly vivid.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Completed dissertation notes and closed the archive cabinet.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: ECO-2026-154': {
    quote: 'Numbers told one story, but communities told the deeper one.',
    milestones: [
      { title: 'First Day', body: 'Started economics lectures with more curiosity than certainty.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Policy simulation day where theory met real-world constraints.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Submitted final research and celebrated with the study circle.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: MUS-2026-091': {
    quote: 'Some semesters are remembered by songs more than schedules.',
    milestones: [
      { title: 'First Day', body: 'First rehearsal room booking and a notebook full of chord progressions.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Annual night performance where everyone sang the final chorus together.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Recorded one last session before packing the studio.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ROLL: LAW-2026-003': {
    quote: 'Arguments sharpened our minds, but empathy shaped our judgment.',
    milestones: [
      { title: 'First Day', body: 'First constitutional law class and the start of countless debates.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Moot court finals where preparation met pressure and poise.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Left the courtroom hall with respect for every voice heard there.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1528747008803-73fca5f4ec1f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ID: FAC-ENG-012': {
    quote: 'Teaching is architecture too, except the structure is human potential.',
    milestones: [
      { title: 'First Day', body: 'Introduced the first systems lab and set the tone for collaborative learning.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Capstone review where student teams defended ideas with confidence.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Closed the semester with pride in every project completed.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  'ID: FAC-ART-007': {
    quote: 'Visual language can hold memory longer than words sometimes can.',
    milestones: [
      { title: 'First Day', body: 'Opened studio foundations and encouraged students to trust process over perfection.', date: 'MID 2023', icon: 'auto_stories' },
      { title: 'Best Memory', body: 'Gallery showcase where every panel carried a distinct voice.', date: '2024-2025', icon: 'star' },
      { title: 'Final Day', body: 'Final critique ended with applause, reflection, and full walls.', date: 'MID 2026', icon: 'outgoing_mail' },
    ],
    fragments: [
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop',
    ],
  },
};

const storyHighlights = [
  {
    kicker: 'Chapter I',
    title: 'First Light',
    body: 'Friendships started with awkward introductions and became routines that shaped every week.',
  },
  {
    kicker: 'Chapter II',
    title: 'Shared Rhythm',
    body: 'Projects, festivals, and cafeteria tables became the informal architecture of belonging.',
  },
  {
    kicker: 'Chapter III',
    title: 'Departure',
    body: 'The final semester became a countdown where every ordinary day suddenly felt precious.',
  },
];

const seedGuestbookEntries = [
  {
    id: 'seed-1',
    message: 'I still remember the smell of the old library on rainy Tuesdays. We thought those nights would last forever.',
    author: "CLARA D., CLASS OF '22",
    createdAt: '2026-01-18T09:00:00.000Z',
  },
  {
    id: 'seed-2',
    message: 'To the group that always sat at the corner table in the cafe: thank you for being my soundtrack in sophomore year.',
    author: "MARCUS W., CLASS OF '23",
    createdAt: '2026-02-10T15:30:00.000Z',
  },
  {
    id: 'seed-3',
    message: 'We arrived as strangers and left with an entire language made of inside jokes and impossible deadlines.',
    author: "NIA O., CLASS OF '24",
    createdAt: '2026-03-02T18:10:00.000Z',
  },
];

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
