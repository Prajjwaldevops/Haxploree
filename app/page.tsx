import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/50 -z-10" />
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block text-sm font-semibold text-emerald-400 mb-4 tracking-wider uppercase">
              About BinSmart
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              A Smarter Way to{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Save the Planet
              </span>
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              E-waste is one of the fastest-growing waste streams globally. BinSmart tackles
              this challenge by making recycling accessible, rewarding, and transparent.
              Our network of AI-powered smart bins ensures that every discarded device
              finds its way to proper recycling facilities.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="glass-card p-6 text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-2">98%</div>
                <div className="text-sm text-slate-400">Recycling Accuracy</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
                <div className="text-sm text-slate-400">Bin Availability</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
                <div className="text-sm text-slate-400">Eco-Certified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[150px] -z-10" />

        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Join thousands of eco-warriors who are transforming e-waste recycling.
            Start earning rewards today.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold px-8 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:-translate-y-1"
          >
            Create Free Account
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
