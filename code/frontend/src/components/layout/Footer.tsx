import { APP_ROUTES } from '@/constants/routes';
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link href={APP_ROUTES.HOME} className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl text-primary">AI Tutor</span>
            </Link>
            <p className="text-gray-500 text-sm">
              Giải pháp học tập thông minh, cá nhân hóa cho học sinh phổ thông.
            </p>
            <p className="text-gray-400 text-xs mt-6">
              © 2024 AI Tutor. All rights reserved.
            </p>
          </div>
          
          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href={APP_ROUTES.FEATURES} className="text-gray-500 hover:text-primary text-sm">Features</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-primary text-sm">Roadmap</Link></li>
              <li><Link href={APP_ROUTES.PRICING} className="text-gray-500 hover:text-primary text-sm">Pricing</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-primary text-sm">About</Link></li>
              <li><Link href={APP_ROUTES.BLOG} className="text-gray-500 hover:text-primary text-sm">Blog</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-primary text-sm">Careers</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-500 hover:text-primary text-sm">Help Center</Link></li>
              <li><Link href="#" className="text-gray-500 hover:text-primary text-sm">Contact</Link></li>
              <li><Link href={APP_ROUTES.FAQ} className="text-gray-500 hover:text-primary text-sm">FAQ</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
