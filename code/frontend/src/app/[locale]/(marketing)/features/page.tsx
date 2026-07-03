import Link from "next/link";
import { Sparkles, ScanText, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Header Section */}
      <section className="w-full bg-gradient-to-b from-blue-50/50 to-white pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Intelligent learning, powered by <br className="hidden sm:block" />
            advanced <span className="text-primary">AI technologies.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how AI Tutor leverages state-of-the-art Retrieval-Augmented Generation (RAG), 
            seamless Optical Character Recognition (OCR), and adaptive algorithms to create a 
            personalized educational experience.
          </p>
        </div>
      </section>

      {/* Feature 1: RAG */}
      <section className="w-full py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart AI Tutor with RAG</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Our AI doesn't just guess; it knows. Powered by Retrieval-Augmented Generation, 
              it provides accurate, curriculum-aligned answers with verifiable citations from 
              approved educational materials, ensuring students receive trustworthy guidance.
            </p>
          </div>
          <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl shadow-lg border border-gray-200 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Placeholder for RAG UI mockup */}
            <div className="text-primary font-medium">RAG Interface Preview</div>
          </div>
        </div>
      </section>

      {/* Feature 2: OCR */}
      <section className="w-full py-16 lg:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="order-2 lg:order-1 w-full aspect-[4/3] bg-gray-100 rounded-2xl shadow-lg border border-gray-200 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
            {/* Placeholder for OCR UI mockup */}
            <div className="text-purple-600 font-medium">OCR Scanner Preview</div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <ScanText className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Instant OCR Timetable Integration</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Say goodbye to manual data entry. Students can simply snap a photo of their 
              physical school timetable or syllabus. Our advanced OCR instantly digitizes the 
              schedule, organizing study sessions and reminders automatically within the app.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to transform how you learn?</h2>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of students achieving better results with AI Tutor.
          </p>
          <Link href="/login?tab=register" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
