import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Smartphone, Shield, Zap, Globe, BarChart3, Activity } from 'lucide-react';
import ProductModel from '../components/ProductModel';
import ProductCarousel from '../components/ProductCarousel';
import MapDemo from '../components/MapDemo';
import { useLanguage } from '../lib/language_context';
import InsamoLogo from '../assets/InsamoLogo.webp';
import LogoITS from '../assets/LogoITS.png';

const LandingPage = () => {
    const { lang, setLang, t } = useLanguage();

    useEffect(() => {
        document.title = "Insamo - Integrated Smart Monitoring";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = t('hero_desc');
        } else {
            const meta = document.createElement('meta');
            meta.name = "description";
            meta.content = t('hero_desc');
            document.head.appendChild(meta);
        }
    }, [lang]);

    return (
        <div className="min-h-screen bg-base-100 font-sans text-base-content scroll-smooth">
            {/* Navbar */}
            <div className="navbar bg-base-100/80 backdrop-blur-md fixed top-0 z-50 px-4 lg:px-56 border-b border-base-200 md:flex md:justify-between ">
                <div className="navbar-start w-full md:w-auto flex justify-between md">
                    <div className="dropdown">
                        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>

                        </div>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64 border border-base-200">
                            <li><a href="#features">{t('features')}</a></li>
                            <li><a href="#demo">{t('demo')}</a></li>
                            <li><a href="#products">{t('products')}</a></li>
                            <li><a href="#about">{t('about_us')}</a></li>
                            <div className="divider my-1"></div>
                            <li>
                                <div className="flex gap-2 p-0">
                                    <button onClick={() => setLang('en')} className={`btn btn-xs flex-1 ${lang === 'en' ? 'btn-primary' : 'btn-ghost'}`}>EN</button>
                                    <button onClick={() => setLang('id')} className={`btn btn-xs flex-1 ${lang === 'id' ? 'btn-primary' : 'btn-ghost'}`}>ID</button>
                                </div>
                            </li>
                            <div className="divider my-1"></div>
                            <li><Link to="/login" className="flex items-center justify-between">{t('login')} <ArrowRight size={14} /></Link></li>
                            <li><Link to="/login" className="btn btn-primary btn-sm text-white mt-1">{t('register')}</Link></li>
                        </ul>
                    </div>
                    <div className='flex justify-center w-full md:w-auto'>

                        <Link to="/" className="btn btn-ghost hover:bg-transparent px-0 flex items-center gap-2">
                            <img src={InsamoLogo} alt="Insamo Logo" className="h-10 w-auto" />
                            <span className="sr-only">Insamo</span>
                            <div className='text-3xl font-black text-primary italic'>
                                INSAMO
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="navbar-center hidden lg:flex md:flex">
                    <ul className="menu menu-horizontal px-1 font-medium items-center">
                        <li><a href="#features" className="hover:text-primary">{t('features')}</a></li>
                        <li><a href="#demo" className="hover:text-primary">{t('demo')}</a></li>
                        <li><a href="#products" className="hover:text-primary">{t('products')}</a></li>
                        <li><a href="#about" className="hover:text-primary">{t('about_us')}</a></li>
                        <div className="divider divider-horizontal h-6 mx-2 my-auto"></div>
                        <div className="join bg-base-200 p-0.5 rounded-xl border border-base-300">
                            <button 
                                onClick={() => setLang('en')} 
                                className={`btn btn-xs join-item border-none ${lang === 'en' ? 'btn-primary text-white shadow-sm' : 'btn-ghost opacity-50 hover:opacity-100'}`}
                            >
                                EN
                            </button>
                            <button 
                                onClick={() => setLang('id')} 
                                className={`btn btn-xs join-item border-none ${lang === 'id' ? 'btn-primary text-white shadow-sm' : 'btn-ghost opacity-50 hover:opacity-100'}`}
                            >
                                ID
                            </button>
                        </div>
                    </ul>
                </div>
                <div className="navbar-end md:w-auto hidden lg:flex">
                    <Link to="/login" className="btn btn-ghost">{t('login')}</Link>
                    <Link to="/register" className="btn btn-primary text-white shadow-lg shadow-primary/30">{t('register')}</Link>
                </div>
            </div>

            {/* Hero Section */}
            <section className="hero min-h-screen relative pt-20 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary via-base-100 to-base-100"></div>
                <div className="hero-content flex-col lg:flex-row-reverse gap-12 lg:gap-20 z-10 max-w-7xl px-4 w-full">
                    <div className="flex-1 w-full relative">
                        {/* 3D Model Viewer */}
                        <div className="relative w-full h-[400px] lg:h-[500px]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl -z-10"></div>
                            <ProductModel />
                            <div className="absolute bottom-4 right-4 text-xs opacity-50 pointer-events-none">
                                Drag to rotate • Scroll to zoom
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6 flex flex-col">
                            <span>
                                <span className="bg-primary bg-clip-text text-transparent">In</span>tegrated
                            </span>
                            <span>
                                <span className="bg-primary bg-clip-text text-transparent">S</span>m
                                <span className="bg-primary bg-clip-text text-transparent">a</span>rt
                            </span>
                            <span>
                                <span className="bg-primary bg-clip-text text-transparent">Mo</span>nitoring
                            </span>
                        </h1>
                        <p className="py-6 text-lg text-base-content/70 max-w-xl mx-auto lg:mx-0">
                            {t('hero_desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/login" className="btn btn-primary btn-lg shadow-xl shadow-primary/30 hover:scale-105 transition-transform">
                                {t('register')} <ArrowRight size={20} />
                            </Link>
                            <a href="#demo" className="btn btn-outline btn-lg hover:bg-base-content hover:text-base-100">
                                {t('view_demo')}
                            </a>
                        </div>
                        {/* <div className="mt-12 flex flex-col items-center lg:items-start gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40 text-center lg:text-left">Joint Collaboration by</span>
                            <div className="flex flex-col sm:flex-row items-center gap-8 grayscale-0 opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                
                                <div className="flex items-center gap-3">
                                    <img src={LogoITS} alt="Logo ITS" className="w-20" />
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-black text-sm tracking-tighter uppercase">Institut Teknologi</span>
                                        <span className="font-bold text-[11px] opacity-70 uppercase">Sepuluh Nopember</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px h-8 bg-base-content/10"></div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center font-black text-secondary text-2xl border border-secondary/20">MKPI</div>
                                    <div className="flex flex-col leading-tight">
                                        <span className="font-black text-sm tracking-tighter uppercase">Pusat Studi MKPI</span>
                                        <span className="font-bold text-[10px] opacity-70 uppercase leading-none">Mitigasi Kebencanaan & <br />Perubahan Iklim</span>
                                    </div>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>

            {/* Solution Snapshot */}
            {/* <section id="features" className="py-24 bg-base-200/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="badge badge-secondary badge-outline mb-4">Features</div>
                        <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-base-content/60 max-w-2xl mx-auto">Complete control over your sensors and data streams with our comprehensive toolkit.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <Globe className="text-primary" size={32} />, title: "Global Connectivity", desc: "Connect sensors from anywhere in the world with our reliable cloud infrastructure." },
                            { icon: <BarChart3 className="text-secondary" size={32} />, title: "Advanced Analytics", desc: "Visualize trends, detect anomalies, and generate reports with just a few clicks." },
                            { icon: <Shield className="text-accent" size={32} />, title: "Enterprise Security", desc: "End-to-end encryption and role-based access control to keep your data safe." },
                        ].map((feature, idx) => (
                            <div key={idx} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 border border-base-200">
                                <div className="card-body">
                                    <div className="p-4 bg-base-200/50 rounded-2xl w-fit mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="card-title text-xl mb-2">{feature.title}</h3>
                                    <p className="text-base-content/70">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* Product Visual / Demo (Map) */}
            <section id="demo" className="py-24 bg-base-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">{t('demo_title')}</h2>
                    <p className="text-base-content/60 max-w-2xl mx-auto mb-12">
                        {t('demo_desc')}
                    </p>

                    <MapDemo />

                    <div className="mt-8">
                        <Link to="/login" className="btn btn-primary btn-lg shadow-xl shadow-primary/30">
                            {t('full_dashboard')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Product Carousel */}
            <section id="products" className="py-24 bg-base-200/50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">{t('solutions_title')}</h2>
                        <p className="text-base-content/60">{t('solutions_desc')}</p>
                    </div>
                    <ProductCarousel />
                </div>
            </section>

            {/* Key Benefits */}
            {/* <section id="benefits" className="py-24 relative overflow-hidden bg-base-200/30">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10"></div>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8">
                            <h2 className="text-4xl font-bold">Why Choose Insamo?</h2>
                            <div className="space-y-6">
                                {[
                                    "Implement rapidly with plug-and-play SDKs",
                                    "Reduce downtime with predictive AI alerts",
                                    "Scale from 10 to 10M devices effortlessly",
                                    "Customizable dashboards for every team member"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="mt-1 text-primary"><CheckCircle size={24} /></div>
                                        <p className="text-lg font-medium">{item}</p>
                                    </div>
                                ))}
                            </div>
                            <Link to="/register" className="btn btn-secondary shadow-lg">Learn More About Benefits</Link>
                        </div>
                        <div className="flex-1 relative w-full">
                            
                            <div className="artboard phone-2 bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl mx-auto overflow-hidden relative">
                                
                                <div className="absolute inset-0 bg-base-100 flex flex-col">
                                    <div className="bg-primary h-32 p-6 flex flex-col justify-end text-primary-content">
                                        <h4 className="font-bold text-2xl">My Devices</h4>
                                        <p className="text-sm opacity-80">All systems operational</p>
                                    </div>
                                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                        {[1, 2, 3, 4].map((n) => (
                                            <div key={n} className="p-4 rounded-xl bg-base-200 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold">S{n}</div>
                                                    <div>
                                                        <div className="font-bold text-sm">Sensor Node {n}</div>
                                                        <div className="text-xs text-success">Active</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono text-xs">24.5°C</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-800 rounded-b-2xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* About Us Section */}
            <section id="about" className="py-24 relative overflow-hidden bg-base-100">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10"></div>
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="badge badge-primary badge-outline font-bold px-4 py-3">{t('about_badge')}</div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold">{t('about_title')}</h2>
                            <div className="space-y-6 text-lg text-base-content/70">
                                <p>{t('about_desc_1')}</p>
                                <p>{t('about_desc_2')}</p>
                            </div>
                            
                            <div className="pt-4 flex flex-col items-center lg:items-start gap-6">
                                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40 text-center lg:text-left">{t('research_collab')}</span>
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md p-2 flex items-center justify-center border border-base-200 group-hover:shadow-xl transition-all">
                                            <img src={LogoITS} alt="Logo ITS" className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="flex flex-col leading-tight">
                                            <span className="font-black text-sm tracking-tighter uppercase">{t('its_name')}</span>
                                            <span className="font-bold text-[11px] opacity-70 uppercase">{t('its_sub')}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden sm:block w-px h-12 bg-base-content/10"></div>
                                    
                                    <div className="flex items-center gap-4 group">
                                        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center font-black text-secondary text-2xl border border-secondary/20 group-hover:bg-secondary group-hover:text-white transition-all shadow-sm">MKPI</div>
                                        <div className="flex flex-col leading-tight">
                                            <span className="font-black text-sm tracking-tighter uppercase">{t('mkpi_name')}</span>
                                            <span className="font-bold text-[10px] opacity-70 uppercase leading-none">{t('mkpi_sub')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative w-full hidden lg:block">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2.5rem] blur-2xl opacity-50"></div>
                                <div className="card bg-base-200 border border-base-300 shadow-2xl overflow-hidden rounded-[2rem]">
                                    <div className="card-body p-0">
                                        <div className="bg-primary p-8 text-primary-content">
                                            <Activity className="mb-4" size={40} />
                                            <h3 className="text-2xl font-bold mb-2 italic">MITIGATION FIRST</h3>
                                            <p className="opacity-80">Our technology is built to save lives and protect assets through early warning systems.</p>
                                        </div>
                                        <div className="p-8 grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-base-100 rounded-xl shadow-sm border border-base-200">
                                                <div className="text-3xl font-black text-primary mb-1">24/7</div>
                                                <div className="text-xs font-bold opacity-50 uppercase">Monitoring</div>
                                            </div>
                                            <div className="p-4 bg-base-100 rounded-xl shadow-sm border border-base-200">
                                                <div className="text-3xl font-black text-secondary mb-1">99.9%</div>
                                                <div className="text-xs font-bold opacity-50 uppercase">Uptime</div>
                                            </div>
                                            <div className="p-4 bg-base-100 rounded-xl shadow-sm border border-base-200">
                                                <div className="text-3xl font-black text-accent mb-1">IoT</div>
                                                <div className="text-xs font-bold opacity-50 uppercase">Powered</div>
                                            </div>
                                            <div className="p-4 bg-base-100 rounded-xl shadow-sm border border-base-200">
                                                <div className="text-3xl font-black text-info mb-1">ITS</div>
                                                <div className="text-xs font-bold opacity-50 uppercase">Research</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-base-300 text-base-content pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2 ">
                        <Link to="/" className="text-3xl font-bold flex items-center gap-3 mb-6">
                            <img src={InsamoLogo} alt="Insamo" className="h-10 w-auto" />
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Insamo</span>
                        </Link>
                        <p className="max-w-md text-base-content/70 mb-6">{t('footer_desc')}</p>
                        <div className="flex gap-4">
                            {/* Social Icons */}
                            {['twitter', 'facebook', 'linkedin', 'github'].map(social => (
                                <button key={social} className="btn btn-circle btn-sm btn-ghost hover:bg-primary hover:text-white">
                                    <span className="sr-only">{social}</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h6 className="footer-title opacity-100 text-base-content">{t('company')}</h6>
                        <ul className="space-y-2 mt-4">
                            <li><a href="#about" className="link link-hover">{t('about_us')}</a></li>
                            <li><a href="#" className="link link-hover">Contact</a></li>
                            <li><a href="#" className="link link-hover">Jobs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="footer-title opacity-100 text-base-content">{t('legal')}</h6>
                        <ul className="space-y-2 mt-4">
                            <li><a href="#" className="link link-hover">{t('terms')}</a></li>
                            <li><a href="#" className="link link-hover">{t('privacy')}</a></li>
                            <li><a href="#" className="link link-hover">{t('cookies')}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-base-content/10 mt-10 pt-6 text-center text-sm text-base-content/60">
                    <p>{t('copyright').replace('{year}', new Date().getFullYear())}</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
