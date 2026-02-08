Hosted Link : [https://haxploree.vercel.app/
](url)

Github Repo : [https://github.com/prajjwaldevops/haxploree
](url)

Demo Video link:[ https://youtu.be/k20OB8-w3Ek?si=2qyMUIymv4wQDQ0b
](url)

PPT link : [https://drive.google.com/file/d/1vqp2fm8ccK7FTcQefEdhk8656FGvpUTx/view?usp=drivesdk
](url)


Admin credentials 

Username: admin

password: root@2309


Haxploree E-Waste Management System: Comprehensive Technical Documentation
1. Executive Summary
Haxploree is a cutting-edge E-Waste Management System designed to tackle the global challenge of electronic waste through gamification and technology. By leveraging AI for object detection and a sophisticated rewards system, we incentivize users to recycle responsibly. The platform is built on a modern, high-performance tech stack ensuring scalability, security, and a premium user experience. This document provides an in-depth look at our architecture, design philosophy, and the complex integrations that power the system.

2. Frontend Architecture & Deployment
The Power of Next.js 16
Our application is built on Next.js 16.1.6, utilizing the revolutionary App Router architecture. This isn't just a standard React app; we've architected it to be server-first by default.

Server Components (RSC): The majority of our application logic resides on the server. This reduces the client-side JavaScript bundle size significantly, leading to faster First Contentful Paint (FCP) and better SEO. Pages like the 
Dashboard
 and Smart Bin interface fetch data securely on the server before rendering, ensuring sensitive API keys and logic remain hidden from the client.
Client Components: We selectively use "use client" directives only for interactive elementsâ€”like the Mapbox map, the drag-and-drop zone in the Deposit page, and the Framer Motion animations. This hybrid approach gives us the best of both worlds: static site speed with dynamic app interactivity.
API Routes: We bypass a traditional separate backend server for most operations. Our backend logicâ€”handling Supabase interactions, R2 uploads, and ML proxyingâ€”lives entirely within Next.js API Routes (app/api/), ensuring type safety and code co-location.
Deployment on Vercel
The application is deployed on Vercel, the creators of Next.js, providing a robust global infrastructure.

Edge Network: Our static assets and cached content are served from Vercel's Edge Network, ensuring low latency regardless of where the user is located.
Serverless Functions: Our API routes effectively become serverless functions that scale automatically with demand. This means we don't manage servers; Vercel spins up instances as needed to handle traffic spikes during events like hackathons.
CI/CD Pipeline: Every push to our main branch triggers an automatic build and deployment pipeline. Vercel runs our build command, optimizes images and assets, and performs a zero-downtime deployment.
3. UI/UX Design Philosophy
Glassmorphism & Aesthetic
We adopted a "Glassmorphism" design language to create a modern, premium feel. This is characterized by:

Translucency: Using backdrop-filter: blur() to create frosted glass effects on cards and modals, giving a sense of depth and hierarchy.
Vibrant Gradients: Deep, rich background gradients that shift subtly, providing a dynamic backdrop that feels "alive."
Dark Mode First: The application is designed primarily for dark mode to reduce eye strain and make our vivid accent colors (Emerald Green for success, Cyan for info) pop.
Responsiveness & Tailwind CSS
We utilize Tailwind CSS for a utility-first styling approach that ensures pixel-perfect responsiveness across all devices.

Mobile-First: Styles are written for mobile screens first and enhanced for tablets (md:) and desktops (lg:).
Fluid Layouts: Using Flexbox and Grid systems, components like the StatCard and SmartBin list automatically rearrange themselves. On mobile, the sidebar collapses into a bottom navigation or hamburger menu, ensuring the critical "Deposit" action is continually accessible.
Touch Optimizations: Interactive elements have expanded touch targets for mobile users, and we prevent layout shifts to ensure a stable viewing experience.
Motion & Interactivity
Framer Motion powers our animations, transforming a static page into a fluid experience.

Page Transitions: Smooth fades and slides when navigating between the Dashboard and Deposit pages.
Micro-interactions: Buttons scale down slightly on press; success messages (like "Upload Complete") pop in with a spring animation. These subtle cues provide tactile feedback that delights users.
4. Core Features Deep Dive
A. Smart Waste Deposit (ML & R2 Integration)
The heart of our system is the AI-powered deposit feature. This complex flow involves multiple services working in harmony.

Image Capture & Upload:

The user drags an image into the dropzone (app/deposit/page.tsx).
We use Cloudflare R2 (an S3-compatible object storage) for cost-effective, high-performance storage.
The backend generates a Signed URL, authorizing the frontend to upload the image directly to R2. This secure method prevents our server from becoming a bottleneck for large file transfers.
Machine Learning Analysis:

Once uploaded, our server sends the image URL to our hosted ML model on Hugging Face Spaces (adii-2685-e-waste-api.hf.space).
External API Call: The analyzeImageWithML function sends a POST request with the image URL.
Scoring & Confidence: The model returns a list of detected objects with confidence scores. Our system parses this response, identifying the object with the highest confidence score (e.g., "Keyboard: 98%").
Safety Thresholds: We display this score to the user. If the confidence is too low/ambiguous, the system can prompt for a clearer image (logic handled in frontend response parsing).
Transaction Recording:

Detailed resultsâ€”including the image R2 link, ML analysis, calculated points, and COâ‚‚ savedâ€”are stored atomically in Supabase.
B. Location Services & Geofencing
We use Mapbox GL JS (react-map-gl) to provide a rich geospatial experience.

Smart Bin Locator:

The "Find Bin" page features an interactive 3D map.
Geolocation API: We request the user's browser location to center the map and calculate the distance to the nearest bin using the Haversine formula.
Custom Markers: Bins are plotted with color-coded markers indicating their fill level (Green < 50%, Amber < 90%, Red > 90%), allowing users to identify available bins at a glance.
Admin-Controlled Radius Check (Geofencing):

To prevent fraud, we implemented a 500m radius check around registered bin locations (centered on BIT Sindri).
Dynamic Setting: This restriction is controlled via a system setting (radius_check_enabled) in the Supabase database.
Admin Toggle: Through the Admin Dashboard, administrators can toggle this setting ON or OFF instantly without redeploying the app.
Logic: When enabled, the deposit API endpoint verifies the user's geocoordinates against the allowed zone before processing the upload. If the user is too far, the transaction is rejected with a specific error message.
C. Admin Dashboard & Analytics
The Admin Dashboard (app/admin/AdminDashboard.tsx) is the command center.

Real-time Analytics: It fetches aggregated data from Supabase to show total users, total waste collected, and environmental impact.
Bin Management: Admins can view the live status of all bins. If a bin reports "Critical" fill levels (via the Smart Bin IoT simulation), it triggers an alert on the dashboard.
Audit Logs: Every transaction is logged and visible here, strictly secured behind our custom admin authentication layer.
5. Security & Data Integrity
Authentication: We rely on Clerk for robust user management. It handles complex flows like 2FA, session management, and profile updates, freeing us to focus on core logic.
Row Level Security (RLS): While primarily handled via API routes now, our Supabase data structure is designed to support RLS, ensuring users can only access their own transaction history.
Environment Variables: All secrets (R2 keys, Admin passwords, API tokens) are strictly managed in .env.local and Vercel's environment variable manager, never exposed to the client bundle.
This documentation accurately reflects the current state of the Haxploree system as of February 2026

